import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Xác thực JWT Token bằng cách gọi Supabase Auth API
// Cách này hoạt động với mọi thuật toán ký (HS256, ES256...) vì Supabase tự xử lý
async function verifySupabaseToken(token: string, supabaseUrl: string, supabaseAnonKey: string): Promise<boolean> {
	try {
		const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
			headers: {
				"Authorization": `Bearer ${token}`,
				"apikey": supabaseAnonKey,
			},
		});
		return response.ok; // 200 = token hợp lệ, 401 = không hợp lệ
	} catch {
		return false;
	}
}

export default {
	async fetch(request: Request, env: Env) {
		// Cấu hình CORS Preflight
		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization",
					"Access-Control-Max-Age": "86400",
				},
			});
		}

		const url = new URL(request.url);

		if (url.pathname !== "/presign") {
			return new Response("Not Found", { status: 404 });
		}

		// 1. Xác thực người dùng qua Supabase Auth API
		const authHeader = request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return new Response("Unauthorized", { status: 401 });
		}

		const token = authHeader.split(" ")[1];
		const isValidToken = await verifySupabaseToken(token, env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
		if (!isValidToken) {
			return new Response("Unauthorized: Invalid Token", { status: 401 });
		}

		const filename = url.searchParams.get("filename");
		if (!filename) {
			return new Response("Bad Request: Missing filename", { status: 400 });
		}

		try {
			// 2. Khởi tạo S3 Client kết nối Cloudflare R2
			const s3 = new S3Client({
				region: "auto",
				endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
				credentials: {
					accessKeyId: env.R2_ACCESS_KEY_ID,
					secretAccessKey: env.R2_SECRET_ACCESS_KEY,
				},
			});

			// 3. Tạo command PutObject
			const command = new PutObjectCommand({
				Bucket: env.R2_BUCKET_NAME,
				Key: filename,
				ContentType: "image/jpeg",
			});

			// Sinh Presigned URL tải lên (Có thời hạn 5 phút)
			const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
			const publicUrl = `${env.R2_PUBLIC_CUSTOM_DOMAIN}/${filename}`;

			return new Response(
				JSON.stringify({ uploadUrl, publicUrl }),
				{
					status: 200,
					headers: {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*",
					}
				}
			);
		} catch (error: any) {
			return new Response(`Server Error: ${error.message}`, { status: 500 });
		}
	}
};

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Hàm tự động xác thực JWT Token HS256 từ Supabase
async function verifyJWT(token, secret) {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return false;

		const [headerB64, payloadB64, signatureB64] = parts;
		const encoder = new TextEncoder();
		const keyData = encoder.encode(secret);
		const key = await crypto.subtle.importKey(
			"raw",
			keyData,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["verify"]
		);

		const data = encoder.encode(`${headerB64}.${payloadB64}`);
		const signature = new Uint8Array(
			atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/'))
				.split('')
				.map(c => c.charCodeAt(0))
		);

		return await crypto.subtle.verify("HMAC", key, signature, data);
	} catch (err) {
		return false;
	}
}

export default {
	async fetch(request, env) {
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

		// 1. Xác thực người dùng qua Supabase JWT Token
		const authHeader = request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return new Response("Unauthorized", { status: 401 });
		}

		const token = authHeader.split(" ")[1];
		const isValidToken = await verifyJWT(token, env.SUPABASE_JWT_SECRET);
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
		} catch (error) {
			return new Response(`Server Error: ${error.message}`, { status: 500 });
		}
	}
};

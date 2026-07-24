---
name: momento-architecture
description: Enforce nested routing conventions, domain-based hook consolidation, and component modularization in the Momento project.
---

# Momento Architecture and Code Organization Guidelines

Always follow these guidelines when adding screens, hooks, components, or making architectural decisions in this repository.

## 1. Directory Structure and Nested Routing (Expo Router)
Screens must be organized under logical resource domains instead of placing flat files at the root of `app/` or creating flat sub-folders.

- **Main Tabs**: Located under `app/(tabs)/`.
- **Resource Routes**: Always group screens by resource (e.g., `destination`, `moment`, `user`).
  - **Detail Screen**: `app/<resource>/[id].tsx` (e.g., `app/destination/[id].tsx`)
  - **Create Screen**: `app/<resource>/create.tsx` (e.g., `app/destination/create.tsx`)
  - **Edit Screen**: `app/<resource>/edit/[id].tsx` (e.g., `app/destination/edit/[id].tsx`)
  - **Avoid flat layouts** such as `app/create-destination.tsx` or `app/edit-destination/[id].tsx`.

## 2. Domain-based Hook Consolidation
Do not create single-purpose, fragmented hooks (e.g., separate hook files for create, edit, list, detail).
Consolidate all database logic and state management relating to a single domain/entity into a unified domain hook file.

- **`hooks/useDestinations.ts`** must export all hooks related to destination management:
  - `useDestinations()` (fetching lists)
  - `useDestinationDetail(id)` (fetching details & associated moments)
  - `useCreateDestination()` (creation states and handlers)
  - `useEditDestination(id)` (edit/delete states and handlers)
- **`hooks/useMoments.ts`** must export all hooks related to moments:
  - `useFeed()` (fetching feed lists)
  - `useMomentDetail(id)` (fetching moment details)
  - `useCreateMoment(initialDestId)` (creation states and handlers)
  - `useEditMoment(id)` (edit/delete states and handlers)

## 3. Thin Screen Components (Presentation vs. Logic)
Keep screen components under `app/` focused on layout orchestration, navigation, and rendering.
- **Extract Logic**: All audio configuration, recording state machines, speech voice retrieval, and database invocations must reside in custom hooks.
- **Extract Subcomponents**: Modals, list item cells, suggested option bars, and complex inline sub-trees must be extracted to modular files under `components/<resource>/` (e.g., `components/bot/MessageItem.tsx`).
- **Encapsulate Styling**: Components should hold their own local stylesheets or import global constants to avoid screen stylesheet bloat.

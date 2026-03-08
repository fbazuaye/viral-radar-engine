

## Plan: Add User Profile Dropdown with Sign Out

### Problem
The profile icon ("CP" circle) in the header is static with no interaction. There is no way to sign out.

### Changes

**Edit `src/components/layout/Header.tsx`:**
- Replace the static "CP" div with a `DropdownMenu` (from existing radix dropdown component)
- Show the user's initials (from `session.user.user_metadata.full_name`) or email fallback
- Dropdown menu items:
  - User name + email display at top
  - "Sign Out" button that calls `supabase.auth.signOut()` and navigates to `/auth`
- Import `useAuth` from AuthContext and `supabase` client
- Import `useNavigate` from react-router-dom

### Technical Details
- Uses existing `@radix-ui/react-dropdown-menu` (already installed)
- Uses existing `useAuth` hook to get session/user data
- Extracts initials from `full_name` metadata (e.g. "frank" → "F")
- Sign out calls `supabase.auth.signOut()` then redirects to `/auth`


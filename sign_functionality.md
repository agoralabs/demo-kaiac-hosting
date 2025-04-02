# Sign Functionality Documentation

The application already has a complete sign up and sign in system implemented. Here's what's available:

## Sign Up
- Available at the `/signup` page
- Allows users to create a new account with:
  - Email
  - Password
  - Password confirmation
- After successful signup, users are redirected to the plans page
- Backend validates email uniqueness

## Sign In (Login)
- Backend endpoint: POST `/api/auth/login`
- Authenticates users with email and password
- Returns a JWT token valid for 24 hours
- Includes user information in the response

## How to Use

1. To sign up for a new account:
   - Navigate to `/signup`
   - Fill in your email and password
   - Click "Sign Up"

2. To sign in to an existing account:
   - Use the login endpoint with your email and password
   - Store the returned JWT token for authenticated requests

The sign functionality is already fully implemented and integrated with JWT authentication. No additional implementation is needed.
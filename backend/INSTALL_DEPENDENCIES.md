# Installing Dependencies

To resolve the "Error: Cannot find module 'bcryptjs'" error, please follow these steps:

1. Make sure you are in the backend directory:
```bash
cd backend
```

2. Install all dependencies by running:
```bash
npm install
```

This will install all required dependencies including the newly added `bcryptjs` module.

If you continue to experience issues, try removing the node_modules directory and package-lock.json file, then run npm install again:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```
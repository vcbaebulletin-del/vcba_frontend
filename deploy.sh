#!/bin/bash

# VCBA E-Bulletin Board Frontend Deployment Script
# This script helps deploy the frontend to various platforms

set -e

echo "🚀 VCBA E-Bulletin Board Frontend Deployment"
echo "============================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend root directory."
    exit 1
fi

# Function to setup environment file
setup_env() {
    echo "📝 Setting up environment configuration..."
    
    if [ ! -f ".env.production" ]; then
        echo "❌ Error: .env.production file not found. Please create it first."
        exit 1
    fi
    
    # Copy production env
    cp .env.production .env
    
    echo "✅ Environment file configured"
}

# Function to install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    npm ci
    echo "✅ Dependencies installed"
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    npm test -- --coverage --watchAll=false
    echo "✅ Tests passed"
}

# Function to build the application
build_app() {
    echo "🔨 Building application for production..."
    npm run build
    echo "✅ Application built successfully"
    echo "📁 Build files are in the 'build' directory"
}

# Function to deploy to Netlify
deploy_netlify() {
    echo "🌐 Deploying to Netlify..."
    
    # Check if Netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        echo "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    # Login to Netlify
    netlify login
    
    # Deploy
    netlify deploy --prod --dir=build
    
    echo "✅ Deployed to Netlify"
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "▲ Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Login to Vercel
    vercel login
    
    # Deploy
    vercel --prod
    
    echo "✅ Deployed to Vercel"
}

# Function to deploy to GitHub Pages
deploy_github_pages() {
    echo "📄 Deploying to GitHub Pages..."
    
    # Install gh-pages if not already installed
    npm install --save-dev gh-pages
    
    # Add homepage to package.json if not present
    if ! grep -q '"homepage"' package.json; then
        read -p "Enter your GitHub Pages URL (e.g., https://username.github.io/repository-name): " homepage_url
        npm pkg set homepage="$homepage_url"
    fi
    
    # Add deploy script if not present
    if ! grep -q '"predeploy"' package.json; then
        npm pkg set scripts.predeploy="npm run build"
        npm pkg set scripts.deploy="gh-pages -d build"
    fi
    
    # Deploy
    npm run deploy
    
    echo "✅ Deployed to GitHub Pages"
}

# Function to deploy to Firebase Hosting
deploy_firebase() {
    echo "🔥 Deploying to Firebase Hosting..."
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        echo "Installing Firebase CLI..."
        npm install -g firebase-tools
    fi
    
    # Login to Firebase
    firebase login
    
    # Initialize if firebase.json doesn't exist
    if [ ! -f "firebase.json" ]; then
        firebase init hosting
    fi
    
    # Deploy
    firebase deploy
    
    echo "✅ Deployed to Firebase Hosting"
}

# Function to create Docker deployment
deploy_docker() {
    echo "🐳 Preparing Docker deployment..."
    
    # Create Dockerfile if it doesn't exist
    if [ ! -f "Dockerfile" ]; then
        cat > Dockerfile << EOF
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
    fi
    
    # Create nginx.conf if it doesn't exist
    if [ ! -f "nginx.conf" ]; then
        cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files \$uri \$uri/ /index.html;
        }
        
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF
    fi
    
    # Build Docker image
    docker build -t vcba-frontend .
    
    echo "✅ Docker image built successfully"
    echo "To run locally: docker run -p 80:80 vcba-frontend"
    echo "To push to registry: docker tag vcba-frontend your-registry/vcba-frontend && docker push your-registry/vcba-frontend"
}

# Main deployment menu
main() {
    echo "Select deployment option:"
    echo "1) Netlify"
    echo "2) Vercel"
    echo "3) GitHub Pages"
    echo "4) Firebase Hosting"
    echo "5) Docker"
    echo "6) Build only"
    echo "7) Exit"
    
    read -p "Enter your choice (1-7): " choice
    
    case $choice in
        1)
            setup_env
            install_deps
            build_app
            deploy_netlify
            ;;
        2)
            setup_env
            install_deps
            build_app
            deploy_vercel
            ;;
        3)
            setup_env
            install_deps
            build_app
            deploy_github_pages
            ;;
        4)
            setup_env
            install_deps
            build_app
            deploy_firebase
            ;;
        5)
            setup_env
            install_deps
            build_app
            deploy_docker
            ;;
        6)
            setup_env
            install_deps
            build_app
            echo "✅ Build complete. Files are in the 'build' directory."
            ;;
        7)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please try again."
            main
            ;;
    esac
}

# Run main function
main

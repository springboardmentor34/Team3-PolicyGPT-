# ============================================================
# STAGE 1: BUILD
# ============================================================
# Angular's TypeScript source code isn't what actually runs in a
# browser — "ng build" compiles it down into plain HTML/CSS/JS files.
# That compiling step needs Node.js and every dev dependency
# (@angular/cli, TypeScript compiler, etc.) — but once the compiled
# output exists, NONE of that is needed anymore to actually serve the
# app to users. That's the whole reason for a "two-stage" build: use a
# full Node environment temporarily, then throw it away and keep only
# the small compiled result.
#
# "AS build" names this stage so Stage 2 below can reach back and grab
# files from it specifically.
FROM node:20-alpine AS build

WORKDIR /app

# Same caching trick as the backend: copy ONLY the dependency
# manifests first. If your actual component code changes but you
# haven't added/removed any npm package, Docker reuses the cached
# "npm ci" layer instead of reinstalling hundreds of packages again.
COPY package.json package-lock.json ./

# "npm ci" (not "npm install") — installs EXACTLY what's in
# package-lock.json, no version drift. Standard practice for any
# automated/reproducible build, Docker or not.
RUN npm ci

# Now copy the rest of your actual source code.
COPY . .

# Compiles the whole app into static files. "production" is the
# default configuration here anyway (confirmed in your angular.json),
# but it's spelled out explicitly so this Dockerfile still does the
# right thing even if that default ever changes later.
RUN npm run build -- --configuration production


# ============================================================
# STAGE 2: SERVE
# ============================================================
# A fresh, separate image — nginx is a lightweight, production-grade
# web server. This stage never installs Node, npm, or Angular CLI at
# all; it only copies the FINISHED compiled files from Stage 1 above.
# This is what keeps your final image small.
FROM nginx:alpine

# Angular 20's "application" builder (confirmed in your angular.json)
# outputs to dist/<project-name>/browser/ — note the extra /browser
# folder, which older Angular versions didn't have. Getting this path
# wrong is the single most common mistake with newer Angular + Docker.
COPY --from=build /app/dist/policygpt-frontend/browser /usr/share/nginx/html

# Angular is a Single Page Application — ALL routes (/citizen-dashboard,
# /policy-search, etc.) are handled by JavaScript in the browser, not
# by separate real files on the server. Without this custom config,
# nginx would try to find a literal file at e.g. /citizen-dashboard,
# fail, and show a 404 the moment someone refreshes the page on any
# route other than the homepage. This config tells nginx: "if you
# can't find a real file matching this path, just serve index.html
# instead and let Angular's own router figure out what to show."
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# nginx's official image already knows how to start itself correctly
# — no custom CMD needed here, unlike the backend's Dockerfile.
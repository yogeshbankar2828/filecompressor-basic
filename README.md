# PackZip

PackZip is a lightweight web application for compressing files and optimizing images. It allows users to upload files, choose a compression mode, process them in the workflow, and download the generated output securely.

It is built for quick and simple file processing with a clean user interface and a fast backend.

## What the website does

- Compress multiple files into a ZIP archive
- Compress a single file into a GZIP file
- Optimize JPG, PNG, and WEBP images for smaller file sizes
- Generate downloadable output files for each job
- Show job status and process results in real time:
- Remove expired files and temporary uploads automatically

## How it works

1. Users upload one or more files from the website.
2. The server checks the selected mode and validates the request.
3. The app processes the file based on ZIP, GZIP, or image optimization mode.
4. The output is saved temporarily and linked to a unique job ID.
5. Users can check the job and download the processed file when ready.

## Tech Stack

- Node.js
- Express.js
- Multer
- Sharp
- Archiver
- MongoDB (optional)
- HTML, CSS, and JavaScript
- Nginx (recommended for production deployment)

## Main Features

- Simple and user-friendly interface
- Support for ZIP, GZIP, and image compression
- Fast processing for everyday file tasks
- Optional database support for job tracking
- Temporary file cleanup and expiry handling
- Easy to host on a VPS or cloud server

## Best Use Cases

- Compress large groups of files
- Reduce image sizes for web and mobile use
- Create downloadable compressed bundles
- Offer a lightweight file processing tool as a website

## Local Run

This project runs locally on:

- http://localhost:3000

To start it:

```bash
npm install
npm start
```

Then open the above URL in your browser.

PackZip is a practical file compression and image optimization website designed to be simple, fast, and easy to use for everyday file processing needs.

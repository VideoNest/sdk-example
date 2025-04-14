# VideoNest SDK Test Application

This project is a test application for the VideoNest SDK. It demonstrates how to use the VideoNest SDK to authenticate, upload videos, check processing status, display video embeds, and list videos from a VideoNest channel.

## Features

- Authentication with VideoNest API
- Video upload with thumbnail generation
- Processing status tracking
- Video embed display (only when processing is complete)
- Listing all videos in a channel

## Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- A VideoNest channel account with API key

## Installation

1. Clone this repository
   ```bash
   git clone https://github.com/your-username/videonest-test-app.git
   cd videonest-test-app
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   
   Create a `.env` file in the root of the project with the following content, replacing with your actual credentials:
   ```
   REACT_APP_CHANNEL_ID=your_channel_id
   REACT_APP_API_KEY=your_api_key
   ```
   
   The test credentials are provided as fallbacks in the code, but using environment variables is recommended for security.

## Running the Application

Start the development server:
```bash
npm start
```

The application will be available at [http://localhost:3002](http://localhost:3002).


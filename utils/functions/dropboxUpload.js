const Dropbox = require("dropbox").Dropbox;
require("dotenv").config();
const REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;
const CLIENT_ID = process.env.DROPBOX_CLIENT_KEY;
const CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET;

// Function to get new access token with retry mechanism
const getNewAccessToken = async () => {
  while (true) {
    try {
      const response = await fetch("https://api.dropbox.com/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: REFRESH_TOKEN,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response: ", errorData);
        throw new Error("Failed to refresh access token");
      }

      const data = await response.json();
      const access_token = data.access_token;
      return access_token;
    } catch (error) {
      console.error("Error refreshing access token, retrying: ", error.message);
      // Optional: You can set a delay before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));  // Wait for 5 seconds before retrying
    }
  }
};

// Initialize Dropbox SDK
const initializeDropbox = async () => {
  const accessToken = await getNewAccessToken();
  return new Dropbox({
    accessToken,
    fetch: require("node-fetch"),
  });
};

// Function to determine file type
const getFileType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "images";
  if (mimetype === "application/pdf") return "pdfs";
  if (mimetype.startsWith("video/")) return "videos";
  return "others";
};

// Function to upload file to Dropbox
const uploadFileToDropbox = async (
  baseDirectory,
  fileBuffer,
  fileName,
  mimetype
) => {
  try {
    const dbx = await initializeDropbox(); // Ensure dbx is initialized with the valid access token

    const fileType = getFileType(mimetype);
    const dropboxPath = baseDirectory.includes("CourseFiles")
      ? `/${baseDirectory}/${fileType}/${fileName}`
      : `/${baseDirectory}/${fileName}`;
    
    // Upload file to Dropbox
    const response = await dbx.filesUpload({
      path: dropboxPath,
      contents: fileBuffer,
      mode: "add",
      autorename: true,
    });

    // Check if a shared link already exists
    const existingLinks = await dbx.sharingListSharedLinks({
      path: response.result.path_lower,
    });
    if (existingLinks.result.links.length > 0) {
      return existingLinks.result.links[0].url.replace("?dl=0", "?raw=1"); // Convert to direct link
    }

    // Generate shareable link if it doesn't exist
    const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
      path: response.result.path_lower,
    });

    return linkResponse.result.url.replace("?dl=0", "?raw=1"); // Convert to direct link
  } catch (error) {
    console.error("Error uploading to Dropbox:", error);
    throw new Error("Dropbox upload failed");
  }
};

module.exports = { uploadFileToDropbox };

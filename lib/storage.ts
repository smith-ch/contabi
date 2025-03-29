import { supabaseClient } from "./supabase"

// Define bucket names
export const BUCKETS = {
  RECEIPTS: "receipts",
  LOGOS: "logos",
  ATTACHMENTS: "attachments",
}

// Initialize buckets if they don't exist
export const initializeStorage = async () => {
  try {
    // Create buckets if they don't exist
    for (const bucket of Object.values(BUCKETS)) {
      const { data: existingBucket, error: getBucketError } = await supabaseClient.storage.getBucket(bucket)

      if (getBucketError && !existingBucket) {
        const { error: createBucketError } = await supabaseClient.storage.createBucket(bucket, {
          public: false, // Files are not public by default
          fileSizeLimit: 5242880, // 5MB
        })

        if (createBucketError) {
          console.error(`Error creating bucket ${bucket}:`, createBucketError)
        }
      }
    }
  } catch (error) {
    console.error("Error initializing storage:", error)
  }
}

// Upload a file to a specific bucket
export const uploadFile = async (
  bucket: string,
  filePath: string,
  file: File,
  userId: string,
): Promise<string | null> => {
  try {
    // Create a unique file path including the user ID to avoid conflicts
    const uniqueFilePath = `${userId}/${filePath}`

    const { data, error } = await supabaseClient.storage.from(bucket).upload(uniqueFilePath, file, {
      cacheControl: "3600",
      upsert: true, // Overwrite if file exists
    })

    if (error) {
      console.error("Error uploading file:", error)
      return null
    }

    // Return the file path
    return data.path
  } catch (error) {
    console.error("Error in uploadFile:", error)
    return null
  }
}

// Get a public URL for a file
export const getFileUrl = async (bucket: string, filePath: string): Promise<string | null> => {
  try {
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error("Error getting file URL:", error)
    return null
  }
}

// Delete a file
export const deleteFile = async (bucket: string, filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabaseClient.storage.from(bucket).remove([filePath])

    if (error) {
      console.error("Error deleting file:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteFile:", error)
    return false
  }
}

// List files in a directory
export const listFiles = async (bucket: string, directory: string): Promise<string[] | null> => {
  try {
    const { data, error } = await supabaseClient.storage.from(bucket).list(directory)

    if (error) {
      console.error("Error listing files:", error)
      return null
    }

    return data.map((file) => file.name)
  } catch (error) {
    console.error("Error in listFiles:", error)
    return null
  }
}


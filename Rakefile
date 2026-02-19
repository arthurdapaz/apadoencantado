# Rakefile for video processing and deployment
require 'aws-sdk-s3'
require 'dotenv/load'
require 'fileutils'

namespace :deploy do
  desc "Process and upload videos to Cloudflare R2"
  task :videos do
    # --- Configuration ---
    source_dir = "local/videos"
    processed_dir = "local/processed_videos"
    bucket_name = ENV['R2_BUCKET_NAME']
    r2_endpoint = ENV['R2_ENDPOINT']
    aws_region = ENV['AWS_REGION']
    public_base_url = "#{r2_endpoint}/#{bucket_name}"

    # --- Setup ---
    # Create directories if they don't exist
    FileUtils.mkdir_p(source_dir)
    FileUtils.mkdir_p(processed_dir)

    # Check for ffmpeg
    unless system('ffmpeg -version > /dev/null 2>&1')
      puts "Error: ffmpeg is not installed. Please install it to proceed."
      exit
    end

    # Check for credentials
    if ENV['AWS_ACCESS_KEY_ID'].to_s.empty? || ENV['AWS_SECRET_ACCESS_KEY'].to_s.empty?
      puts "Error: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are not set in your .env file."
      exit
    end

    # --- S3 Client ---
    s3_client = Aws::S3::Client.new(
      endpoint: r2_endpoint,
      region: aws_region,
      access_key_id: ENV['AWS_ACCESS_KEY_ID'],
      secret_access_key: ENV['AWS_SECRET_ACCESS_KEY']
    )

    puts "Looking for videos in #{source_dir}..."

    # --- Main Logic ---
    Dir.glob("#{source_dir}/*.{mp4,mov,avi,mkv}").each do |input_file|
      basename = File.basename(input_file, ".*")
      puts "\nProcessing: #{basename}"

      # --- Define output paths ---
      output_4k_webm = "#{processed_dir}/#{basename}-4k.webm"
      output_720p_mp4 = "#{processed_dir}/#{basename}-720p.mp4"

      # --- Process High Quality (4K WebM) ---
      if File.exist?(output_4k_webm)
        puts "  -> 4K WebM version already exists. Skipping processing."
      else
        puts "  -> Generating 4K WebM version..."
        ffmpeg_4k_command = "ffmpeg -i \"#{input_file}\" -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus \"#{output_4k_webm}\""
        system(ffmpeg_4k_command)
      end

      # --- Process Low Quality (720p MP4) ---
      if File.exist?(output_720p_mp4)
        puts "  -> 720p MP4 version already exists. Skipping processing."
      else
        puts "  -> Generating 720p MP4 version..."
        ffmpeg_720p_command = "ffmpeg -i \"#{input_file}\" -vf \"scale=-1:720,fps=30\" -c:v libx264 -crf 28 -preset faster -c:a aac \"#{output_720p_mp4}\""
        system(ffmpeg_720p_command)
      end

      # --- Upload to R2 ---
      [output_4k_webm, output_720p_mp4].each do |file_to_upload|
        if File.exist?(file_to_upload)
          key = File.basename(file_to_upload)
          puts "  -> Uploading #{key} to R2 bucket '#{bucket_name}'..."
          
          begin
            File.open(file_to_upload, 'rb') do |file|
              s3_client.put_object(
                bucket: bucket_name,
                key: key,
                body: file,
                acl: 'public-read' # Make the file publicly accessible
              )
            end
            puts "    - Upload successful."
          rescue Aws::S3::Errors::ServiceError => e
            puts "    - Error uploading #{key}: #{e.message}"
          end
        else
          puts "  -> Could not find #{File.basename(file_to_upload)} to upload. It might have failed to generate."
        end
      end

      # --- Print URLs ---
      puts "\n--- Video URLs for #{basename} ---"
      puts "High Quality (WebM): #{public_base_url}/#{File.basename(output_4k_webm)}"
      puts "Low Quality (MP4):   #{public_base_url}/#{File.basename(output_720p_mp4)}"
      puts "------------------------------------"
    end

    puts "\nVideo deployment process finished."
  end
end

# Rakefile for video processing and deployment
require 'aws-sdk-s3'
require 'dotenv/load'
require 'fileutils'

MAX_HEIGHT = 1080

namespace :deploy do
  desc "Convert video to WebM and upload to Cloudflare R2"
  task :videos do
    # --- Configuration ---
    source_dir    = "_local/videos"
    processed_dir = "_local/processed_videos"
    bucket_name   = ENV['R2_BUCKET_NAME']
    r2_endpoint   = ENV['R2_ENDPOINT']
    aws_region    = ENV['AWS_REGION']
    public_base_url = ENV['R2_PUBLIC_URL'] || "#{r2_endpoint}/#{bucket_name}"

    # --- Setup ---
    FileUtils.mkdir_p(source_dir)
    FileUtils.mkdir_p(processed_dir)

    # Check for ffmpeg and ffprobe
    unless system('ffmpeg -version > /dev/null 2>&1') && system('ffprobe -version > /dev/null 2>&1')
      puts "Error: ffmpeg or ffprobe is not installed."
      exit 1
    end

    # Check for credentials
    if ENV['AWS_ACCESS_KEY_ID'].to_s.empty? || ENV['AWS_SECRET_ACCESS_KEY'].to_s.empty?
      puts "Error: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are not set in your .env file."
      exit 1
    end

    # --- S3 Client (Cloudflare R2) ---
    s3_client = Aws::S3::Client.new(
      endpoint:          r2_endpoint,
      region:            aws_region,
      access_key_id:     ENV['AWS_ACCESS_KEY_ID'],
      secret_access_key: ENV['AWS_SECRET_ACCESS_KEY']
    )

    puts "Looking for videos in #{source_dir}..."

    # Glob case-insensitively, then deduplicate by resolved path to avoid
    # macOS double-matches (e.g. *.mp4 and *.MP4 hitting the same file).
    video_files = Dir.glob("#{source_dir}/*.{mp4,mov,avi,mkv}", File::FNM_CASEFOLD)
                     .map { |f| File.realpath(f) }
                     .uniq

    video_files.each do |input_file|
      basename = File.basename(input_file, ".*")
      output_webm = "#{processed_dir}/#{basename}.webm"

      puts "\n--- #{basename} ---"

      # --- Detect original dimensions ---
      raw = `ffprobe -v error -select_streams v:0 \
        -show_entries stream=width,height \
        -of csv=p=0:s=x "#{input_file}"`.strip
      orig_w, orig_h = raw.split('x').map(&:to_i)

      if orig_w.zero? || orig_h.zero?
        puts "  -> Could not read dimensions. Skipping."
        next
      end

      puts "  -> Original: #{orig_w}x#{orig_h}"

      # --- Determine output scale ---
      # If height > MAX_HEIGHT (e.g. 2K/4K), cap to 1080p preserving aspect ratio.
      # scale=-2:HEIGHT ensures width is always divisible by 2 (VP9 requirement).
      scale_filter = if orig_h <= MAX_HEIGHT
        "scale=-2:#{orig_h}"   # keep original height, let ffmpeg fix width parity
      else
        puts "  -> Downscaling to #{MAX_HEIGHT}p"
        "scale=-2:#{MAX_HEIGHT}"
      end

      # Cap to 30fps — halves file size for 60fps sources with no perceptible loss.
      vf = "#{scale_filter},fps=30"

      # --- Skip if already converted ---
      if File.exist?(output_webm)
        puts "  -> Already converted. Skipping ffmpeg. (delete the file to re-convert)"
      else
        puts "  -> Converting to WebM (VP9)..."
        # -deadline good -cpu-used 4: ~10-20x faster than default, minimal quality loss
        # -row-mt 1 -threads 0: full multithreaded row encoding across all CPU cores
        # -crf 33: good visual quality; lower = better quality, larger file
        # -b:v 0: pure CRF mode (no bitrate cap)
        cmd = <<~CMD.gsub("\n", " ")
          ffmpeg -i "#{input_file}"
          -hide_banner
          -loglevel error
          -vf "#{vf}"
          -c:v libvpx-vp9
          -crf 35 -b:v 0
          -deadline realtime
          -cpu-used 8
          -row-mt 1
          -b:a 128k
          -c:a libopus 
          "#{output_webm}"
        CMD

        success = system(cmd)
        unless success
          puts "  -> Conversion FAILED. Skipping upload."
          next
        end

        size_mb = (File.size(output_webm) / 1024.0 / 1024.0).round(1)
        puts "  -> Done. Output size: #{size_mb} MB"
      end

      # --- Upload to R2 ---
      key = File.basename(output_webm)
      puts "  -> Uploading #{key} to R2..."
      begin
        File.open(output_webm, 'rb') do |f|
          s3_client.put_object(
            bucket:       bucket_name,
            key:          key,
            body:         f,
            content_type: 'video/webm'
          )
        end
        puts "  -> Upload successful."
        puts "  -> Public URL: #{public_base_url}/#{key}"
      rescue Aws::S3::Errors::ServiceError => e
        puts "  -> Upload error: #{e.message}"
      end
    end

    puts "\nDone."
  end
end

#!/usr/bin/env ruby
require "html_compressor"
require "terser"
require "ruby-clean-css"
require "warning"
require "pry"

Gem.path.each do |path|
  Warning.ignore(//, path)
end

compressor = HtmlCompressor::HtmlCompressor.new

lines = File.readlines("index.html").map do |line|
  if line.match? "favicon"
    line.gsub!('"', "'").gsub!("images/favicon.ico", "//tc2000.fly.dev/images/favicon.ico")
    line
  elsif line.match? "styles.css"
    css = File.read("styles/styles.css").gsub('"', "'")
    css.gsub!("images/poker-table.png", "//tc2000.fly.dev/images/poker-table.png")

    <<~CSS
      <style>
        #{RubyCleanCSS::Compressor.new.compress(css)}
      </style>
    CSS
  elsif line.match? "index.js"
    <<~JS
      <script type='text/javascript'>
        #{Terser.compile(
          File.read("js/index.js").gsub('"', "'"),
          compress: {
            collapse_vars: true,
            reduce_vars: true,
            reduce_funcs: true,
            keep_fnames: true,
          },
          output: {
            quote_style: :single
          }
        )}
      </script>
    JS
  else
    line.gsub('"', "'");
  end
end

html = lines.join()
compressed = compressor.compress(lines.join())
File.open("compressed.html", "w+") do |file|
  file.write(compressed)
end
puts "--> Built compressed.html"

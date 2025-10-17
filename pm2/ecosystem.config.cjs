/** PM2 process config for API (Fastify + Socket.io) */
module.exports = {
  apps: [
    {
      name: "api",
      script: "/app/services/api/server.js",
      exec_mode: "fork",          // set "cluster" to scale CPU-bound
      instances: 1,
      watch: false,
      node_args: "--max-old-space-size=256",
      env: {
        NODE_ENV: "production",
        API_HOST: process.env.API_HOST || "0.0.0.0",
        API_PORT: process.env.API_PORT || "3000",
      },
      max_memory_restart: "300M",
      out_file: "/dev/stdout",
      error_file: "/dev/stderr",
      merge_logs: true,
    },
  ],
};

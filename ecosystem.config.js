module.exports = {
	apps: [
		{
			name: "SERVER",
			script: "./build/app.js",
			instances: 4,
			autorestart: true,
			watch: true,
			stop_exit_codes: [0],
			exp_backoff_restart_delay: 100,
			max_memory_restart: '4G',
			ignore_watch: [
				"node_modules", 
				".git", 
				"ecosystem.config.js", 
				"./src/public", 
				"*.log",
			],
			exec_mode: "cluster",
			wait_ready: true,
			max_restarts: 4,
			listen_timeout: 10000,
			env: {
				NODE_ENV: "development",
			},
			env_production: {
				NODE_ENV: "production",
			},
		},
	],
};

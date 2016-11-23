# es_auction
SE: Rest api for SE-front homework site 

## For start

1. git clone https://github.com/andryuha49/es_auction.git
2. cd es_auction
3. npm install
4. npm run -s build && node dist

## Configuration

### SMTP

Configure SMTP in config.json in section "smtp"

```json
"smtp": {
		"host": "smtp.gmail.com",
		"port": 465,
		"secure": true,
		"auth": {
			"user": "user@gmail.com",
			"pass": "password"
		}
	}
```

note: For Gmail you may need to configure "Allow Less Secure Apps" in your Gmail account. [Click Here.](https://www.google.com/settings/security/lesssecureapps)

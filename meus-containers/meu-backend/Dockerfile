FROM node:20-alpine

# Diz para o container trabalhar na pasta /backend lá dentro dele
WORKDIR /backend

EXPOSE 82

# Instala os pacotes na inicialização para o volume não apagá-los
CMD ["sh", "-c", "npm install express cors swagger-ui-express && node server.js"]

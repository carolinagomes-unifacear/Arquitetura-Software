const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 82; 

// Ativa o bypass global do CORS de forma totalmente aberta para o laboratório
app.use(cors());
app.use(express.json());

const caminhoLog = path.join(__dirname, 'historico.txt');

// Memória central do correio assíncrono
let bancoDeCartas = []; 

function gravarNoArquivoTexto(mensagem) {
    const dataHora = new Date().toLocaleString('pt-BR');
    const linhaLog = `[${dataHora}] ${mensagem}\n`;
    fs.appendFile(caminhoLog, linhaLog, (err) => {
        if (err) console.error("Erro interno no log:", err);
    });
}

// Configuração estruturada do Swagger UI para documentar o laboratório
const swaggerDocument = {
    openapi: "3.0.0",
    info: { 
        title: "📬 Servidor de Correio Postal Assíncrono", 
        description: "API de armazenamento de caixas postais baseada em IPs.",
        version: "2.5.0" 
    },
    paths: {
        "/enviar": { 
            post: { 
                summary: "Posta uma carta destinada a um IP específico",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    remetente: { type: "string", example: "Aluno_Ana" },
                                    ipOrigem: { type: "string", example: "192.168.1.15" },
                                    ipDestinatario: { type: "string", example: "192.168.1.20" },
                                    mensagem: { type: "string", example: "Olá!" }
                                }
                            }
                        }
                    }
                },
                responses: { 200: { description: "Guardada." } }
            } 
        },
        "/status": { 
            get: { 
                summary: "Puxa as cartas da caixa postal filtrando pelo IP fornecido",
                parameters: [
                    { name: "ip", in: "query", required: true, schema: { type: "string" }, description: "O IP da caixa postal do aluno" }
                ],
                responses: { 200: { description: "Listagem das cartas." } }
            } 
        }
    }
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/', (req, res) => res.redirect('/api-docs'));

// ==========================================
// ROTAS DO CORREIO ASSÍNCRONO
// ==========================================

// 1. Rota para Postar uma carta
app.post('/enviar', (req, res) => {
    const { remetente, ipOrigem, ipDestinatario, mensagem } = req.body;

    if (!remetente || !ipOrigem || !ipDestinatario || !mensagem) {
        return res.status(400).json({ erro: "Campos obrigatórios ausentes (remetente, ipOrigem, ipDestinatario, mensagem)." });
    }

    let ipOrigemLimpo = ipOrigem.trim() === 'localhost' ? '127.0.0.1' : ipOrigem.trim();
    let ipDestinoLimpo = ipDestinatario.trim() === 'localhost' ? '127.0.0.1' : ipDestinatario.trim();

    const novaCarta = {
        remetente,
        ipOrigem: ipOrigemLimpo,   // IP que o Front informou ser dele
        ipDestino: ipDestinoLimpo, // IP da caixa postal onde a carta vai esperar
        mensagem,
        data: new Date().toLocaleTimeString()
    };

    bancoDeCartas.push(novaCarta);
    gravarNoArquivoTexto(`POSTAGEM -> De [${ipOrigemLimpo}] para [${ipDestinoLimpo}] | Remetente: ${remetente} | Msg: ${mensagem}`);

    return res.json({ sucesso: true, status: "Carta Guardada com Sucesso!" });
});

// 2. Rota para Buscar cartas da caixa postal
app.get('/status', (req, res) => {
    const ipSolicitante = req.query.ip;

    if (!ipSolicitante) {
        return res.status(400).json({ erro: "É necessário informar o parâmetro '?ip=' para ler a caixa postal." });
    }

    let ipLimpo = ipSolicitante.trim() === 'localhost' ? '127.0.0.1' : ipSolicitante.trim();

    // Filtra o banco de dados central baseado no IP digitado na tela do Front
    const enviadasPeloIp = bancoDeCartas.filter(c => c.ipOrigem === ipLimpo);
    const recebidasNoIp = bancoDeCartas.filter(c => c.ipDestino === ipLimpo);

    res.json({
        meu_ip: ipLimpo,
        enviadas: enviadasPeloIp,
        recebidas: recebidasNoIp
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando perfeitamente na porta ${PORT}`);
});

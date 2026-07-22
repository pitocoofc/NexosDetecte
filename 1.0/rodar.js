const fs = require('fs');
const path = require('path');

class MemoryClassifier {
    constructor(caminhoModelo) {
        if (!fs.existsSync(caminhoModelo)) {
            throw new Error(`Modelo não encontrado em "${caminhoModelo}". Treine o modelo primeiro!`);
        }

        const conteudo = fs.readFileSync(caminhoModelo, 'utf-8');
        const dados = JSON.parse(conteudo);

        this.vocabulario = new Set(dados.vocabulario);
        this.pesosTermos = dados.pesosTermos || {};
        this.bias = dados.bias || 0.0;
        this.idf = dados.idf || {};
    }

    tokenizar(texto) {
        const palavras = texto.toLowerCase()
            .replace(/[^\w\sà-ú]/gi, ' ')
            .split(/\s+/)
            .filter(p => p.length > 2);

        const bigramas = [];
        for (let i = 0; i < palavras.length - 1; i++) {
            bigramas.push(`${palavras[i]}_${palavras[i+1]}`);
        }

        return [...palavras, ...bigramas];
    }

    sigmoide(z) {
        if (z > 15) return 0.99999;
        if (z < -15) return 0.00001;
        return 1 / (1 + Math.exp(-z));
    }

    analisarTexto(texto) {
        const tokens = this.tokenizar(texto);
        if (tokens.length === 0) {
            return { probabilidadeIa: 0.5, classe: "INDEFINIDO", tokensRelevantes: [] };
        }


        const tf = {};
        tokens.forEach(token => tf[token] = (tf[token] || 0) + 1);
        for (const token in tf) {
            tf[token] = tf[token] / tokens.length;
        }


        let sumaPonderada = this.bias;
        const analiseTermos = [];

        for (const token in tf) {
            if (this.pesosTermos[token] !== undefined) {
                const idf = this.idf[token] || 1;
                const tfidf = tf[token] * idf;
                const impacto = tfidf * this.pesosTermos[token];
                
                sumaPonderada += impacto;
                analiseTermos.push({ token, impacto });
            }
        }

        const probIa = this.sigmoide(sumaPonderada);
        
        // Ordena os termos que mais puxaram para IA (+) ou Humano (-)
        analiseTermos.sort((a, b) => Math.abs(b.impacto) - Math.abs(a.impacto));

        return {
            probabilidadeIa: probIa,
            classe: probIa >= 0.5 ? 'IA' : 'HUMANO',
            termosMarcantes: analiseTermos.slice(0, 5) 
        };
    }
}


(() => {
    const arqModelo = path.join(__dirname, 'modelo_ia.json');
    const arqTexto = path.join(__dirname, 'texto.txt');

    if (!fs.existsSync(arqTexto)) {
        console.error(` Crie o arquivo "texto.txt" com o texto que deseja analisar.`);
        return;
    }

    try {
        const classificador = new MemoryClassifier(arqModelo);
        const texto = fs.readFileSync(arqTexto, 'utf-8').trim();

        if (texto.length < 5) {
            console.log("⚠️ O texto.txt está muito curto para uma análise confiável.");
            return;
        }

        console.log(`\n📄 Analisando "texto.txt" (${texto.length} caracteres)...`);
        
        const resultado = classificador.analisarTexto(texto);
        const pctIa = (resultado.probabilidadeIa * 100).toFixed(1);
        const pctHumano = ((1 - resultado.probabilidadeIa) * 100).toFixed(1);

        console.log(`\n--- RESULTADO DA ANÁLISE ---`);
        if (resultado.classe === 'IA') {
            console.log(` Classificação: IA (${pctIa}% de certeza)`);
        } else {
            console.log(` Classificação: HUMANO (${pctHumano}% de certeza)`);
        }

        if (resultado.termosMarcantes.length > 0) {
            console.log(`\n Termos de maior peso na decisão:`);
            resultado.termosMarcantes.forEach(t => {
                const tipo = t.impacto > 0 ? 'Puxou p/ IA' : 'Puxou p/ Humano';
                console.log(`  • "${t.token}" -> ${tipo} (${t.impacto.toFixed(4)})`);
            });
        }

    } catch (err) {
        console.error(` Erro: ${err.message}`);
    }
})();

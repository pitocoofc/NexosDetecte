# O que é "NexosDetecte?"

Um modelo de identificação de textos com IA
Como esse projeto foi feito:
- Banco de dados publicos
- Treinamentos diarios
- Imitação de sistema LLM
e dentre outras coisas

"Posso utilizar esse modelo comercialmente?"
Claro...Apenas siga as Clausulas da AGPL

versão: 1.0.0
modelo utilizado para dados de IA: Deepseek


Arquitetura:
- TF-IDF + Classificador Linear
- Função de ativação: Sigmoide

Parâmetros treinados:
- 8284 pesos de termos
- 8284 pesos IDF
- 1 bias

Total aproximado:
16569 valores numéricos armazenados

// script.js (VERSÃO MAIS ESTÁVEL E LIMPA)

// 1. LÓGICA DE ADICIONAR/REMOVER ITENS DO FORMULÁRIO
// =========================================================

function criarItemHTML(nome = '', quantidade = '', valor = '') {
    const novoItemDiv = document.createElement('div');
    novoItemDiv.classList.add('item-row');
    novoItemDiv.innerHTML = `
        <input type="text" class="nome-item" placeholder="Nome do Produto/Serviço" value="${nome}" required>
        <input type="number" class="quantidade" placeholder="Qtd" min="1" value="${quantidade || 1}" required>
        <input type="number" class="valor-unitario" placeholder="R$ Unit." min="0.01" step="0.01" value="${valor || 0.00}" required>
        <button type="button" class="remover-item">Remover</button>
    `;
    return novoItemDiv;
}

document.addEventListener('DOMContentLoaded', () => {
    // Adiciona o primeiro item na tela
    if (document.getElementById('itens-container').children.length === 0) {
        document.getElementById('itens-container').appendChild(criarItemHTML());
    }
});

document.getElementById('adicionar-item').addEventListener('click', () => {
    document.getElementById('itens-container').appendChild(criarItemHTML());
});

document.getElementById('itens-container').addEventListener('click', (event) => {
    if (event.target.classList.contains('remover-item')) {
        event.target.closest('.item-row').remove();
    }
});


// 2. LÓGICA DE GERAÇÃO DO PDF (Método doc.html() simples - Corrigido o erro)
// =========================================================

document.getElementById('orcamento-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Captura e Validação dos Dados
    const nomeCliente = document.getElementById('cliente').value.trim();
    const dataInput = document.getElementById('data').value;
    
    if (!nomeCliente || !dataInput) {
        alert("Por favor, preencha o Nome do Cliente e a Data.");
        return;
    }

    const dataOrcamento = new Date(dataInput + 'T00:00:00').toLocaleDateString('pt-BR');
    let itens = [];
    let totalGeral = 0;
    
    document.querySelectorAll('#itens-container .item-row').forEach(itemDiv => {
        const nome = itemDiv.querySelector('.nome-item').value.trim();
        const qtd = parseInt(itemDiv.querySelector('.quantidade').value);
        const valorUnit = parseFloat(itemDiv.querySelector('.valor-unitario').value);
        
        if (nome && !isNaN(qtd) && qtd > 0 && !isNaN(valorUnit) && valorUnit >= 0) {
            const subtotal = qtd * valorUnit;
            totalGeral += subtotal;
            itens.push({ nome, qtd, valorUnit, subtotal });
        }
    });

    if (itens.length === 0) {
        alert("Por favor, adicione pelo menos um item válido ao pedido.");
        return;
    }

    // Monta o HTML do Orçamento
    let tabelaItensHTML = itens.map(item => `
        <tr>
            <td>${item.nome}</td>
            <td>${item.qtd}</td>
            <td class="valor-celula">R$ ${item.valorUnit.toFixed(2).replace('.', ',')}</td>
            <td class="valor-celula">R$ ${item.subtotal.toFixed(2).replace('.', ',')}</td>
        </tr>
    `).join('');

    const templateHTML = `
        <div id="orcamento-final">
            <div class="header-pdf">
                <h1>ORÇAMENTO OFICIAL</h1>
                <p>Doceria Doce Sabor 🎂</p>
                <p>CNPJ: XX.XXX.XXX/0001-XX | Telefone: (XX) XXXX-XXXX</p>
            </div>
            
            <div class="info-cliente">
                <p><strong>Cliente:</strong> ${nomeCliente}</p>
                <p><strong>Data do Orçamento:</strong> ${dataOrcamento}</p>
                <p><strong>Validade:</strong> 7 dias</p>
            </div>
            
            <table class="orcamento-tabela">
                <thead>
                    <tr>
                        <th style="width: 40%;">Produto/Serviço</th>
                        <th style="width: 15%;">Qtd</th>
                        <th style="width: 20%;">Valor Unit.</th>
                        <th style="width: 25%;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${tabelaItensHTML}
                </tbody>
            </table>
            
            <div class="total-area">
                <p><strong>TOTAL GERAL:</strong></p>
                <p class="valor-total">R$ ${totalGeral.toFixed(2).replace('.', ',')}</p>
            </div>
            
            <div class="observacao-rodape">
                <p>* Valores sujeitos a alteração após 7 dias.</p>
                <p>Agradecemos a preferência!</p>
            </div>
        </div>
    `;

    const pdfTemplate = document.getElementById('orcamento-pdf-template');
    pdfTemplate.innerHTML = templateHTML;

    // --- GERAÇÃO USANDO DOC.HTML ---
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const options = {
        callback: function(doc) {
            const nomeArquivo = `Orcamento_${nomeCliente.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getFullYear()}.pdf`;
            doc.save(nomeArquivo);
        },
        // ESTAS OPÇÕES SÃO ESSENCIAIS E NÃO CONTÊM REFERÊNCIA AO html2canvas:
        x: 10,
        y: 10,
        width: 190,
        windowWidth: 750 
    };
    
    doc.html(pdfTemplate, options);
    
    pdfTemplate.innerHTML = '';
});
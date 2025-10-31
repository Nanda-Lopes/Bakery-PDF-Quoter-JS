// script.js (VERSÃO MAIS ROBUSTA COM HTML2CANVAS EXPLÍCITO)

// 1. LÓGICA DE ADICIONAR/REMOVER ITENS DO FORMULÁRIO (SEM ALTERAÇÃO)
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


// 2. LÓGICA DE GERAÇÃO DO PDF (Método HTML2CANVAS + JSDPF)
// =========================================================

document.getElementById('orcamento-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Captura e Validação dos Dados (SEM ALTERAÇÃO)
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

    // Monta o HTML do Orçamento (SEM ALTERAÇÃO)
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

    // --- GERAÇÃO USANDO HTML2CANVAS + JSDPF ---
    const element = document.getElementById('orcamento-final');

    // Linha 127
    html2canvas(element, { 
        scale: 2, 
        logging: false, 
        useCORS: true,
        backgroundColor: '#ffffffd1', // CRUCIAL: Força o fundo cinza Dolce
        allowTaint: true 
    }).then(canvas => {
        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        // Verifica se o conteúdo é maior que uma página A4
        if (imgHeight > pdfHeight) {
            // Lógica para que o conteúdo caiba na primeira página (mantida por simplicidade)
            const imgWidth = pdfWidth;
            const imgHeightCalculated = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeightCalculated);
            
        } else {
            // Se couber na página
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        }

        const nomeArquivo = `Orcamento_${nomeCliente.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getFullYear()}.pdf`;
        pdf.save(nomeArquivo);

        // Limpa o template após a geração
        pdfTemplate.innerHTML = '';
    });
}); // Linha 154
let produtos = JSON.parse(localStorage.getItem('produtos_db')) || [];
let idSelecionado = null;
let imagemBase64 = '';

// Seletores DOM
const ui = {
    listagem: document.getElementById('tela-listagem'),
    cadastro: document.getElementById('tela-cadastro'),
    form: document.getElementById('form-produto'),
    tabela: document.getElementById('tabela-produtos'),
    tbody: document.getElementById('tabela-corpo'),
    emptyState: document.getElementById('estado-vazio'),
    busca: document.getElementById('busca-produto'),
    modal: document.getElementById('modal-overlay'),
    tituloForm: document.getElementById('titulo-form'),
    inputImg: document.getElementById('imagem'),
    previewImg: document.getElementById('preview-imagem')
};

// Eventos Iniciais
document.getElementById('btn-novo-produto').addEventListener('click', () => toggleTela(true));
document.getElementById('btn-cancelar').addEventListener('click', () => toggleTela(false));
document.getElementById('btn-cancelar-exclusao').addEventListener('click', fecharModal);
document.getElementById('btn-confirmar-exclusao').addEventListener('click', confirmarExclusao);
ui.busca.addEventListener('input', (e) => carregarTabela(e.target.value));

// Upload e conversão de imagem
ui.inputImg.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        mostrarAviso('Imagem excede o limite de 2MB.', 'erro');
        ui.inputImg.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (evento) => {
        imagemBase64 = evento.target.result;
        ui.previewImg.src = imagemBase64;
        ui.previewImg.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

function toggleTela(isCadastro, produto = null) {
    ui.listagem.classList.toggle('hidden', isCadastro);
    ui.cadastro.classList.toggle('hidden', !isCadastro);
    
    if (!isCadastro) {
        ui.busca.value = '';
        carregarTabela();
        return;
    }

    if (produto) {
        ui.tituloForm.textContent = 'Editar Produto';
        document.getElementById('produto-id').value = produto.id;
        document.getElementById('nome').value = produto.nome;
        document.getElementById('descricao').value = produto.descricao;
        document.getElementById('valor').value = produto.valor;
        document.getElementById('disponivel').value = produto.disponivel;
        
        imagemBase64 = produto.imagem || '';
        if (imagemBase64) {
            ui.previewImg.src = imagemBase64;
            ui.previewImg.classList.remove('hidden');
        } else {
            ui.previewImg.classList.add('hidden');
        }
    } else {
        ui.tituloForm.textContent = 'Novo Produto';
        ui.form.reset();
        document.getElementById('produto-id').value = '';
        imagemBase64 = '';
        ui.previewImg.src = '';
        ui.previewImg.classList.add('hidden');
    }
}

function carregarTabela(termoBusca = '') {
    ui.tbody.innerHTML = '';
    const filtro = termoBusca.toLowerCase();
    
    // Filtra e ordena por valor (menor para maior)
    const dados = produtos
        .filter(p => p.nome.toLowerCase().includes(filtro))
        .sort((a, b) => a.valor - b.valor);

    if (dados.length === 0) {
        ui.emptyState.classList.remove('hidden');
        ui.tabela.classList.add('hidden');
        return;
    }

    ui.emptyState.classList.add('hidden');
    ui.tabela.classList.remove('hidden');

    dados.forEach(p => {
        const tr = document.createElement('tr');
        const badgeClass = p.disponivel === 'sim' ? 'badge-sim' : 'badge-nao';
        const imgPlaceholder = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2245%22%20height%3D%2245%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%223%22%20width%3D%2218%22%20height%3D%2218%22%20rx%3D%222%22%20ry%3D%222%22%3E%3C%2Frect%3E%3Ccircle%20cx%3D%228.5%22%20cy%3D%228.5%22%20r%3D%221.5%22%3E%3C%2Fcircle%3E%3Cpolyline%20points%3D%2221%2015%2016%2010%205%2021%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E';

        tr.innerHTML = `
            <td><img src="${p.imagem || imgPlaceholder}" class="img-miniatura" alt="Produto"></td>
            <td><strong>${p.nome}</strong></td>
            <td>${Number(p.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td><span class="badge ${badgeClass}">${p.disponivel === 'sim' ? 'Sim' : 'Não'}</span></td>
            <td class="acoes-td">
                <button class="btn-icon btn-edit" onclick="editarItem('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon btn-del" onclick="abrirExclusao('${p.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        ui.tbody.appendChild(tr);
    });
}

ui.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const idAtual = document.getElementById('produto-id').value;
    const valorFloat = parseFloat(document.getElementById('valor').value);

    const payload = {
        id: idAtual || crypto.randomUUID(),
        nome: document.getElementById('nome').value.trim(),
        descricao: document.getElementById('descricao').value.trim(),
        valor: valorFloat,
        disponivel: document.getElementById('disponivel').value,
        imagem: imagemBase64
    };

    try {
        if (idAtual) {
            const index = produtos.findIndex(p => p.id === idAtual);
            produtos[index] = payload;
            mostrarAviso('Produto atualizado!');
        } else {
            produtos.push(payload);
            mostrarAviso('Produto cadastrado!');
        }
        
        localStorage.setItem('produtos_db', JSON.stringify(produtos));
        toggleTela(false);
    } catch (err) {
        mostrarAviso('Erro ao salvar. Verifique o tamanho da imagem.', 'erro');
    }
});

window.editarItem = (id) => {
    const item = produtos.find(p => p.id === id);
    if (item) toggleTela(true, item);
};

window.abrirExclusao = (id) => {
    idSelecionado = id;
    ui.modal.classList.remove('hidden');
};

function fecharModal() {
    idSelecionado = null;
    ui.modal.classList.add('hidden');
}

function confirmarExclusao() {
    if (!idSelecionado) return;
    
    produtos = produtos.filter(p => p.id !== idSelecionado);
    localStorage.setItem('produtos_db', JSON.stringify(produtos));
    carregarTabela();
    fecharModal();
    mostrarAviso('Produto removido.');
}

function mostrarAviso(msg, tipo = 'sucesso') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<i class="fa-solid ${tipo === 'sucesso' ? 'fa-check' : 'fa-triangle-exclamation'}"></i> ${msg}`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Inicialização
carregarTabela();
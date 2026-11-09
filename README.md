# Boas Memórias

Vitrine responsiva para uma loja de brinquedos antigos. A entrega contém uma interface estática para GitHub Pages e uma API Java com cadastro de usuários, autenticação e publicação de anúncios.

> **Estado atual:** a vitrine abre no GitHub Pages sem servidor. Os brinquedos de exemplo, favoritos e sacola são demonstrações do navegador. O cadastro e a publicação de anúncios só gravam dados quando a API Java e o PostgreSQL estão hospedados e conectados. O Pages não executa Java nem fornece banco de dados.

## Planejamento do projeto com IA

O planejamento foi organizado em torno das necessidades de quem compra e de quem vende:

1. **Descoberta:** permitir que a pessoa entenda rapidamente o propósito da loja e encontre brinquedos por busca, categoria e preço.
2. **Confiança:** comunicar com clareza o estado de conservação, valor e limitações de cada item; não inventar avaliações, vendas ou garantias.
3. **Compra:** salvar favoritos e reunir itens na sacola, com avisos explícitos de que a demonstração não processa pedidos ou pagamentos.
4. **Venda:** oferecer um formulário simples de anúncio e, quando a API estiver conectada, gravá-lo associado à conta autenticada.
5. **Cadastro responsável:** coletar nome, e-mail, celular, cidade, UF e senha. O formulário não pede o endereço residencial completo. A senha é armazenada apenas como hash BCrypt pelo backend.
6. **Acessibilidade e alcance:** usar HTML semântico, foco visível, rótulos acessíveis, navegação por teclado e layouts adaptados para celular, tablet e desktop.
7. **Evolução:** publicar o front-end no Pages e hospedar API e banco separadamente. Só então conectar pagamentos, logística, mensagens, upload de imagens e moderação.

## Estrutura do projeto

```text
boas-memorias/
├── .github/workflows/pages.yml   # publicação automática do front-end no Pages
├── backend/                      # API Java Spring Boot
│   ├── pom.xml
│   └── src/main/
│       ├── java/br/com/boasmemorias/
│       └── resources/application.properties
├── site/                         # único conteúdo publicado pelo Pages
│   ├── index.html                # página e formulários semânticos
│   └── src/
│       ├── css/style.css         # estilos globais e responsividade
│       └── js/index.js           # busca, filtros, favoritos, sacola e API
└── README.md
```

## Tecnologias

- **HTML:** estrutura semântica de cabeçalho, navegação, seções, catálogo, diálogos e formulários. Rótulos e regiões de status dão suporte a leitores de tela.
- **CSS:** sistema global de cores, tipografia, botões, cartões, diálogos e layouts responsivos com Grid e Flexbox. Inclui foco visível e preferência por movimento reduzido.
- **Java:** API REST com Spring Boot para criar conta, autenticar e publicar anúncios. Spring Security protege a publicação; BCrypt guarda hashes de senhas e tokens JWT têm validade limitada.
- **SQL:** PostgreSQL mantém usuários e anúncios. `backend/src/main/resources/schema.sql` cria as tabelas, índices, chaves estrangeiras e restrições para preço, estado, categoria e conservação.
- **JavaScript:** interação da vitrine e chamadas à API. Sem `data-api-base`, os formulários avisam que estão em demonstração e não enviam nem guardam dados pessoais.

## Executar a interface

Com Python 3 instalado, na pasta do projeto:

```powershell
python -m http.server 4173 --directory site
```

Abra <http://localhost:4173>. A vitrine funciona sem instalar dependências JavaScript. As peças e preços são ilustrativos.

## Preparar a API Java e o banco

Requisitos: Java 21, Maven 3.6.3 ou superior e PostgreSQL. Crie um banco chamado `boas_memorias` (por exemplo, com `CREATE DATABASE boas_memorias;`), defina as variáveis de ambiente e então inicie o backend:

```powershell
$env:DATABASE_URL = 'jdbc:postgresql://localhost:5432/boas_memorias'
$env:DATABASE_USERNAME = 'postgres'
$env:DATABASE_PASSWORD = 'SUA_SENHA_LOCAL'
$jwtBytes = [byte[]]::new(48)
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($jwtBytes)
$env:JWT_SECRET_BASE64 = [Convert]::ToBase64String($jwtBytes)
$rng.Dispose()
$env:CORS_ALLOWED_ORIGIN = 'http://localhost:4173'
mvn -f backend/pom.xml spring-boot:run
```

Configure uma chave JWT aleatória e exclusiva no ambiente; não grave segredos no Git. O projeto aplica `schema.sql` ao iniciar. Para produção, use um banco PostgreSQL gerenciado com backups e credenciais próprias.

Depois de hospedar a API em HTTPS, coloque a origem completa no atributo `data-api-base` de `site/index.html`, por exemplo:

```html
<html lang="pt-BR" data-api-base="https://api.seu-dominio.com">
```

Configure `CORS_ALLOWED_ORIGIN` com a origem exata do Pages (somente protocolo e host, sem o caminho `/boas-memorias`). O front-end envia cadastro para `POST /api/auth/register`, entrada para `POST /api/auth/login` e anúncio autenticado para `POST /api/products`. O GET público `GET /api/products` lista anúncios ativos. O token fica somente na memória da página; fechar ou atualizar a página exige entrar novamente.

## Publicar no GitHub Pages

1. Crie um repositório GitHub chamado `boas-memorias` e envie os arquivos deste projeto. Para configurar pelo terminal:

   ```powershell
   git init -b main
   git add .
   git commit -m "Criar vitrine Boas Memórias"
   git remote add origin https://github.com/SEU-USUARIO/boas-memorias.git
   git push -u origin main
   ```

   Troque `SEU-USUARIO` pelo seu nome de usuário e use a visibilidade escolhida para o repositório.
2. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions** como fonte.
3. Envie um commit para a branch `main`. O workflow em `.github/workflows/pages.yml` publica somente a pasta `site/`; o código Java e configurações do backend não entram no site estático.
4. O endereço aparece em **Settings → Pages** após o primeiro workflow terminar.

O Pages publica somente o front-end. Para cadastro e anúncios reais, hospede também o backend e o PostgreSQL. Este repositório não contém credenciais de hospedagem, domínio, gateway de pagamento ou conta GitHub.

## Próximos passos para uma loja em operação

- Hospedar API e PostgreSQL com TLS, backups, monitoramento e política de retenção.
- Adicionar mensagens entre comprador e vendedor, verificação de e-mail, recuperação de conta e rate limiting.
- Integrar pagamento e cálculo/rastreamento de entrega usando provedores contratados pela loja.
- Substituir as ilustrações e registros de demonstração por fotos e anúncios reais, com moderação e upload seguro.
- Publicar termos de uso e aviso de privacidade final e validar o tratamento de dados pessoais antes de abrir o cadastro ao público. Imagens fornecidas por endereço HTTPS são carregadas pelo navegador diretamente do servidor da foto.

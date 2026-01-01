# Guia de Deploy no Vercel

Este projeto está configurado para ser facilmente hospedado na Vercel. Siga os passos abaixo para colocar sua aplicação no ar.

## Pré-requisitos

1.  Uma conta no [GitHub](https://github.com/).
2.  Uma conta na [Vercel](https://vercel.com/) vinculada ao seu GitHub.
3.  O projeto deve estar salvo em um repositório no seu GitHub.

## Passo a Passo para Deploy

1.  **Acesse a Vercel:**
    - Vá para o [Dashboard da Vercel](https://vercel.com/dashboard) e clique em **"Add New..."** -> **"Project"**.

2.  **Importe o Repositório:**
    - Localize o repositório `sistema-agendamento` (ou o nome que você deu) na lista e clique em **"Import"**.

3.  **Configuração do Projeto:**
    - **Framework Preset:** A Vercel deve detectar automaticamente como `Vite`. Se não, selecione `Vite` manualmente.
    - **Root Directory:** Certifique-se de que está apontando para a raiz onde está o `package.json` (neste caso, `sistema-agendamento`). Se o `package.json` estiver na raiz do repositório, deixe como está `./`.

4.  **Variáveis de Ambiente (MUITO IMPORTANTE):**
    - Clique na seção **"Environment Variables"** para expandi-la.
    - Você precisa adicionar as mesmas variáveis que estão no seu arquivo `.env`:
        - **Nome:** `VITE_SUPABASE_URL`
        - **Valor:** (Sua URL do Supabase)
        - Clique em **Add**.
        - **Nome:** `VITE_SUPABASE_ANON_KEY`
        - **Valor:** (Sua chave Anon do Supabase)
        - Clique em **Add**.

5.  **Build e Deploy:**
    - Clique no botão **"Deploy"**.
    - Aguarde alguns instantes enquanto a Vercel constrói e implanta seu projeto.

6.  **Conclusão:**
    - Se tudo der certo, você verá uma tela de "Congratulations!".
    - Clique na imagem do preview para acessar seu site ao vivo.

## Solução de Problemas Comuns

- **Erro 404 ao recarregar a página:**
    - O projeto já possui um arquivo `vercel.json` configurado para lidar com rotas SPA (Single Page Application). Se tiver problemas, verifique se esse arquivo está presente na raiz da pasta `sistema-agendamento`.

- **Erro de Conexão com o Banco de Dados:**
    - Verifique se as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` foram copiadas corretamente, sem espaços extras.

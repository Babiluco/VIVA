// Configuração do Viva.
// Deixe os valores vazios para usar o modo demonstração (dados de exemplo, sem login).
// Para ativar o login e salvar os dados, preencha com os valores do seu projeto Supabase:
//   url: "Project URL"   (ex.: https://abcdxyz.supabase.co)
//   key: a chave PUBLISHABLE (começa com sb_publishable_...). Projetos antigos podem ter a chave
//        "anon" (começa com eyJ...), que também funciona até a Supabase desativá-la (fim de 2026).
// Onde achar: botão "Connect" do projeto, ou Settings > API Keys.
// A chave publishable/anon é pública por natureza: quem protege os dados é o Row Level Security do banco.
// NUNCA coloque aqui a chave "secret" (sb_secret_...) nem a "service_role".
window.VIVA_CONFIG = {
  url: '',
  key: ''
};

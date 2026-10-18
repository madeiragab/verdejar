# 01 · Requisitos

> Levantamento feito a partir da conversa com o cliente (15/10/2026).

## Visão

Um site **público e gratuito** para divulgar espécies de plantas por região do Brasil.
Qualquer pessoa consulta; quem faz login contribui; um **mediador** revisa e aprova
antes de qualquer conteúdo ficar público.

## Atores

| Ator | Pode |
|---|---|
| **Visitante** (sem login) | Ver plantas da sua região, filtrar por estado/município, buscar, ver detalhes, ler notícias |
| **Colaborador** (com login) | Tudo do visitante + enviar registros de plantas, acompanhar o status, corrigir registros recusados |
| **Mediador** | Tudo do colaborador + aprovar / recusar registros pendentes com observação |
| **Administrador** | Tudo do mediador + promover usuários a mediador/admin, forçar atualização de notícias |

## Requisitos funcionais

| ID | Requisito | Origem na conversa |
|---|---|---|
| RF01 | Detectar a localização do visitante e já mostrar as plantas próximas na página inicial | "identificasse a região em que a pessoa está e logo de cara mostrasse as plantas" |
| RF02 | Filtrar por estado e município; ordenar pelas mais próximas | "filtrar por município e localizar as informações mais próximas" |
| RF03 | Consultar plantas de outras regiões | "possa consultar as das outras regiões também" |
| RF04 | Cada registro tem: foto, nome científico, nome(s) popular(es), família, bioma, clima, necessidade de luz, necessidade de água, uso medicinal, toxicidade, curiosidades, local (UF, município, coordenadas) e **fonte** da pesquisa | mensagens 1 e 3 |
| RF05 | Cadastro e login de usuários | "quem fizer login pode abastecer" |
| RF06 | Registros enviados ficam **pendentes** até um mediador aprovar | "deve ser avaliado e autorizado por um mediador" |
| RF07 | Mediador pode recusar com observação; o colaborador corrige e reenvia | decorrência de RF06 |
| RF08 | O nome do colaborador só aparece se ele **autorizar** | "se a pessoa autorizar a informação de quem foi o colaborador" |
| RF09 | Conteúdo inicial pré-carregado | "pode já ter algumas pra ter conteúdo" |
| RF10 | Seção de notícias de clima e meio ambiente puxadas de sites específicos | "puxasse notícias sobre o clima e meio ambiente de sites específicos" |

## Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | **Custo zero** de operação ("eu não posso pagar") → só serviços com plano gratuito |
| RNF02 | Front e back separados, comunicando por **API REST/JSON** |
| RNF03 | Autenticação **JWT** (access token curto + refresh token em cookie httpOnly) |
| RNF04 | Senhas com hash bcrypt; validação de toda entrada; rate limit no login |
| RNF05 | Responsivo (a maioria vai acessar pelo celular) |
| RNF06 | Interface em português |
| RNF07 | Fácil de rodar localmente sem instalar banco de dados (SQLite no dev) |

## Fora do escopo desta primeira versão

- App mobile nativo
- Identificação automática de espécie por foto (IA)
- Comentários / curtidas
- Vários locais por registro (cada envio = uma planta em um lugar)

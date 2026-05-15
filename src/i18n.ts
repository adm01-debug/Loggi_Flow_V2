import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'pt-BR',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      'pt-BR': {
        translation: {
          common: {
            loading: 'Carregando...',
            error: 'Ocorreu um erro',
            save: 'Salvar',
            cancel: 'Cancelar',
            delete: 'Excluir',
            edit: 'Editar',
            search: 'Pesquisar...',
          },
          nav: {
            dashboard: 'Dashboard',
            shipments: 'Envios',
            customers: 'Clientes',
            settings: 'Configurações',
          }
        }
      }
    }
  });

export default i18n;

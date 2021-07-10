// @ts-expect-error "TODO"

import { VlCore, VlUtil, VlInfoblock, i18n } from '@govflanders/vl-ui-vue-components';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import App from './App.vue';
import router from './router';
import store from './store';

Vue.component('vl-infoblock', VlInfoblock);

Vue.use(VueI18n);
Vue.use(VlCore);
Vue.use(VlUtil);

const messages = i18n;
const vlI18n = new VueI18n({ locale: 'nl-BE', messages });

// @ts-expect-error "TODO"
Vue.use(vlI18n);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: elem => elem(App),
}).$mount('#app');

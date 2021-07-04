import etcs from "./components/engines/electronic_tech_comp_s/sceneComp.vue";
import etcd from "./components/engines/electronic_tech_comp_d/sceneComp.vue";
import ct from "./components/engines/cover_tech/sceneComp.vue";
import etp from "./components/engines/electronic_tech_part/sceneComp.vue";
import eus from "./components/engines/electronic_user_s/sceneComp.vue";
import cu from "./components/engines/cover_user/sceneComp.vue";
import eud from "./components/engines/electronic_user_s/sceneComp.vue";
import cou from "./components/engines/code_user/sceneComp.vue";

const Components = {
  etcs,
  etcd,
  ct,
  etp,
  eus,
  cu,
  eud,
  cou
};

function install(Vue) {
  if (install.installed) return;
  install.installed = true;
  Object.keys(Components).forEach(name => {
    Vue.component(name, Components[name]);
  });
}

const plugin = {
  install
};

let GlobalVue = null;
if (typeof window !== "undefined") {
  GlobalVue = window.Vue;
} else if (typeof global !== "undefined") {
  GlobalVue = global.vue;
}

if (GlobalVue) {
  GlobalVue.use(plugin);
}

Object.keys(Components).forEach(name => {
  Components[name].install = install;
});

export default Components;
<template>
  <v-app>
    <v-app-bar app color="white" light>
      <div class="">
        <v-img
          alt="Cheater Checker Logo"
           contain
          src="/img/logo.png"
          transition="scale-transition"
          height="36"
        />
      </div>


    </v-app-bar>

    <v-content>
      <router-view></router-view>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "App",

  data: () => ({
    //
  })
});
</script>

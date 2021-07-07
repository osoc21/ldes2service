<template>
  <div class="home">
    <ControlPanel/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import ControlPanel from '@/components/ControlPanel.vue'; // @ is an alias to /src

@Component({
  components: {
    ControlPanel,
  },
})
export default class Home extends Vue {}
</script>

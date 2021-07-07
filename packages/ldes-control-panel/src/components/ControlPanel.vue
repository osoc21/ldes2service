<template>
  <div class="hello">
    <h1>LDES 2 Service Control Panel</h1>

    <form>
      <label for="ldes-uri">LDES URI</label>
      <input type="text" id="ldes-uri" :value="msg" placeholder="https://example.org/ldes" />
      <br />
      <label for="polling-interval">Polling interval (ms)</label> 
      <input type="number" id="polling-interval" value="5000" />

      <fieldset>
        <legend>Integrations</legend>

        <input type="checkbox" id="mongodb" name="mongodb" />
        <label for="mongodb">MongoDB</label>

        <br />

        <input type="checkbox" id="postgres" name="postgres" />
        <label for="postgres">Postgres</label>
      </fieldset>
      <input type="submit" value="start replicating">
    </form>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ControlPanel extends Vue {
  @Prop() private msg!: string;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
label {
  display: inline-block;
  text-align: left;
}

input[type='checkbox'] {
  display: inline-block;
  width: min-content;
  margin-right: 10px;
}

input[type='submit']{
  margin-top: 10px;
  padding: 5px;
}

input {
  width: 100%;
  margin: 10px 0;
}

.hello {
  display: block;
  max-width: 800px;
  margin: 20px auto;
  text-align: left;
}
</style>

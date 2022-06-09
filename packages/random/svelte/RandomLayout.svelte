<script>
  export let templateHtml;

</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="container">{@html templateHtml}</div>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
  }

</style>

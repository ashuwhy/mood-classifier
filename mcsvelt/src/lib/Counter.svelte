<script lang="ts">
  let count: number = $state(0)
  const increment = () => {
    count += 1
  }
</script>

<button onclick={increment} class="bg-blue-500 text-white px-4 py-2 rounded-md">
  count is {count}
</button>

<script setup>
  import { ref, inject, computed, onBeforeMount, onMounted } from 'vue';

  const searchQuery = inject("searchQuery");
  const { inputRef, updateInputRef } = inject("inputRef");

  const DOMref = ref(null);
  
  const placeholderValue = computed(() => {
    return searchQuery.value.length === 0 ? 'search' : searchQuery.value;
  });

  onMounted(() => {
    updateInputRef(DOMref.value);
  });

</script>

<template>
  <input ref="DOMref" class="interactive interactive--focused search__input" type="search" :placeholder="placeholderValue">
</template>

<style scoped>
  .search__container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    margin: 40px 0;
  }
  .search__label {
    margin-right: 10px;
  }
  .search__input {
    width: 150px;
    padding: 0 10px;
    outline: 0;
  }
</style>
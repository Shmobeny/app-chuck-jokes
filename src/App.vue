<script setup>
  import { onErrorCaptured, ref, computed, provide } from 'vue';
  import Wrapper from './components/Wrapper.vue';
  import Joke from './components/Joke.vue';
  import Button from './components/Button.vue';
  import Bookmarks from './components/Bookmarks.vue';

  const categories = ref(["search"]);
  const categoriesIsFetched = ref(false);
  const activeCategory = ref("random");
  const searchQuery = ref("");
  const inputRef = ref(null);
  const suspenseJokeStatus = ref("pending");
  const jokeKey = ref(`joke-${Date.now()}`);
  const bookmarksActive = ref(false);
  const bookmarks = ref(JSON.parse(localStorage.getItem("bookmarks")) || {
    items: [],
    IDs: []
  });
  
  const isShared = computed(() => {
    return (window.location.search.length > 0) && (window.location.pathname === "/shared") ? true : false;
  });

  const url = computed(() => {
    return isShared.value ? `https://api.chucknorris.io/jokes/${window.location.search.slice(4)}` :
           activeCategory.value === "search" ? `https://api.chucknorris.io/jokes/search?query=${searchQuery.value}` :
           activeCategory.value === "random" ? `https://api.chucknorris.io/jokes/random` : `https://api.chucknorris.io/jokes/random?category=${activeCategory.value}`;
  });

  provide('categories', {
    categories,
    updateCategories
  });

  provide('categoriesIsFetched', {
    categoriesIsFetched,
    updateCategoriesIsFetched
  });

  provide('searchQuery', searchQuery);

  provide('activeCategory', {
    activeCategory,
    updateActiveCategory
  });

  provide('inputRef', {
    inputRef,
    updateInputRef
  });

  provide('bookmarks', {
    bookmarks,
    editBookmarks
  });

  provide('bookmarksActive', {
    bookmarksActive,
    toggleBookmarks
  });

  function updateCategories(newValue) {
    categories.value = [...newValue];
  }

  function updateCategoriesIsFetched() {
    categoriesIsFetched.value = !categoriesIsFetched.value;
  }

  function updateActiveCategory(newValue) {
    activeCategory.value = newValue;
  }

  function updateInputRef(DOMElement) {
    inputRef.value = DOMElement;
  }

  function editBookmarks(action, target) {
    if (action === "add") {
      target.category = (target.categories.length === 0) && (activeCategory.value === "search") ? `search (${searchQuery.value})` : 
                        (target.categories.length === 0) && (activeCategory.value !== "search") ? activeCategory.value : target.categories[0];
      target.timeStamp = Date.now();
      target.addedToBookmarks = getDate(target.timeStamp);
      
      bookmarks.value.items.unshift(target);
      bookmarks.value.IDs.unshift(target.id);
      
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks.value));
    }

    if (action === "remove") {
      const targetIndex = bookmarks.value.IDs.indexOf(target.id);
      
      bookmarks.value.items.splice(targetIndex, 1);
      bookmarks.value.IDs.splice(targetIndex, 1);

      localStorage.setItem('bookmarks', JSON.stringify(bookmarks.value));
    }
    
    function getDate(timestamp) {
      const date = new Date(timestamp);

      let year = date.getFullYear();
      
      let month = date.getMonth() + 1 + "";
      month.length === 1 ? month = "0" + month : month = month;
      
      let day = date.getDate() + "";
      day.length === 1 ? day = "0" + day : day = day;
      
      let hours = date.getHours() + "";
      hours.length === 1 ? hours = "0" + hours : hours = hours;
      
      let minutes = date.getMinutes() + "";
      minutes.length === 1 ? minutes = "0" + minutes : minutes = minutes;

      return `${year}.${month}.${day} - ${hours}:${minutes}`;
    }
  }

  function getNewJoke() {
    if (isShared.value) {
      window.location.assign(window.location.origin);
      return;
    }

    if (activeCategory.value === "search" && (inputRef.value.value.length > 0)) searchQuery.value = inputRef.value.value;

    jokeKey.value = `joke-${Date.now()}`;
  }

  function toggleBookmarks() {
    window.scrollTo({
      top: 0
    });
    bookmarksActive.value = !bookmarksActive.value;
  }

  onErrorCaptured((err) => {
    console.log(err);
    suspenseJokeStatus.value = "error";
  });

</script>

<template>
  <h1 class="title">Chuck's Jokes</h1>
  
  <Transition name="slider" mode="out-in">
    <KeepAlive>
      <component
        :is="Wrapper"
        v-if="bookmarksActive === false"
      >
        <Suspense
          :timeout="0" 
          @pending='(suspenseJokeStatus = "pending")'
          @resolve='(suspenseJokeStatus = "resolved")'
        >
          <component
            :is="Wrapper"
            class="wrapper"
            :key="jokeKey"
          >
            <Joke
              :url="url"
              :activeCategory="activeCategory"
              :searchQuery="searchQuery"
              :isShared="isShared"
              @toggleBookmarks="toggleBookmarks"
            />

            <Button @click="getNewJoke">{{isShared ? "Explore more" : "Get a new joke"}}</Button>
          </component>

          <template #fallback>
            <div class="fatal-error" v-if='suspenseJokeStatus === "error"'>
              <p class="fatal-error__message">Fatal application error :(</p>
              <Button @click="getNewJoke">Retry</Button>
            </div>

            <div v-else class="loader">
              <div class="loader__img"></div>
              <span class="loader__text">Loading...</span>
            </div>
          </template>
        </Suspense>
      </component>
      
      <Bookmarks
        v-else
        :bookmarks="bookmarks"
        :bookmarksActive="bookmarksActive"
        @toggleBookmarks="toggleBookmarks"
      />
    </KeepAlive>
  </Transition>

</template>

<style scoped>
  .title {
    text-align: center;
    margin-bottom: 40px;
    text-shadow: 1px 1px 1px orange;
  }

  @media screen and (max-width: 600px) {
    .title {
      margin-bottom: 10px;
      font-size: 55px;
    }
  }

  .wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .fatal-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .fatal-error__message {
    margin-bottom: 40px;
    text-shadow: 1px 1px 1px red;
  }

  .loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .loader__img {
    display: block;
    width: 200px;
    height: 200px;
    border: 4px solid orange;
    border-radius: 50%;
    background-image: url('./assets/chuck_1.jpg');
    background-repeat: no-repeat;
    background-size: contain;
    animation: loader-rotate 1s cubic-bezier(.49,-0.46,.51,1.43) infinite;
  }

  .slider-enter-active,
  .slider-leave-active {
    transition-property: all;
    transition-duration: 500ms;
    transition-timing-function: cubic-bezier(1,-0.6,0,1.6);
  }

  .slider-enter-from {
    opacity: 0;
    transform: translateX(500px);
  }

  .slider-leave-to {
    opacity: 0;
    transform: translateX(-500px);
  }

  @keyframes loader-rotate {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
</style>

<script setup>
  import { inject, onActivated, ref } from 'vue';
  import Button from './Button.vue';
  
  const { bookmarks, editBookmarks } = inject("bookmarks");
  const { bookmarksActive, toggleBookmarks } = inject("bookmarksActive");
  const bookmarksContainer = ref(null);
  const bookmarksElems = ref([]);
  const bookmarksTimeStamps = ref([]);

  let animationMemory = {
    shiftedElems: null,
    currentPadding: 0,
    hintTimeout: null
  };

  const observerParts = {
    callback: (entries, observer) => {
      if (entries[0].isIntersecting) return;

      switch (entries[0].boundingClientRect.y <= 0) {
        case true:
          let scrollTarget = (entries[0].boundingClientRect.y + window.pageYOffset) - (entries[0].rootBounds.height - entries[0].boundingClientRect.height) - 1;

          window.scrollTo({
            top: scrollTarget > 0 ? scrollTarget : 0,
            behavior: 'smooth'
          });

          if (scrollTarget <= 0) window.addEventListener("scroll", scrollEvent);

          function scrollEvent(e) {
            if (window.pageYOffset === 0) {
              bookmarksContainer.value.style.paddingBottom = `0px`;
              animationMemory.currentPadding = 0;
              window.removeEventListener("scroll", scrollEvent); 
            } 
          }

          break;
        
        default:
          bookmarksContainer.value.style.paddingBottom = `0px`;
          animationMemory.currentPadding = 0;
          observer.disconnect();
      }
    },
    options: {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 1
    }
  };

  const observer = new IntersectionObserver(observerParts.callback, observerParts.options);

  function onBeforeLeave(elem) {
    elem.classList.add("delete-animation-target");
    
    const indexOfElem = [...elem.parentElement.children].indexOf(elem);
    const margin = 10;
    animationMemory.currentPadding = window.pageYOffset === 0 ? 0 : animationMemory.currentPadding + elem.offsetHeight + margin; 

    moveBrothers();
    observer.disconnect();

    function moveBrothers() {
      animationMemory.shiftedElems = bookmarksElems.value.slice(indexOfElem, bookmarksElems.value.length);
      
      animationMemory.shiftedElems.forEach(item => {
        item.classList.add("delete-animation-brothers");
        item.style.transform = `translateY(-${elem.offsetHeight + margin}px)`;
      });
    }

  }

  function onAfterLeave(elem) {
    bookmarksContainer.value.style.paddingBottom = `${animationMemory.currentPadding}px`;

    animationMemory.shiftedElems.forEach(item => {
      item.classList.remove("delete-animation-brothers");
      item.style.transform = ``;
    });
    
    if (bookmarks.value.IDs.length > 0) observer.observe(bookmarksElems.value[bookmarksElems.value.length - 1]);
  }
  
  function slide(e, bookmark) {
    if (isInAnimation()) return;
    
    let initailX = e.x;
    let pickedBookmark = e.target.closest('.bookmark__main-content');

    pickedBookmark.setPointerCapture(e.pointerId);
    pickedBookmark.ondragstart = () => false;

    pickedBookmark.style.transition = `unset`;
    
    pickedBookmark.addEventListener('pointermove', coords);
    pickedBookmark.onpointerup = letGoBookmark;
    pickedBookmark.onpointercancel = letGoBookmark;

    function coords(e) {
      let shiftX = e.x - initailX;

      if ( (shiftX <= -10 && shiftX >= -100) || (shiftX >= 10 && shiftX <= 100) ) {
        pickedBookmark.style.transform = `translateX(${shiftX}px)`;
        preventBookmarkUIHint("perm");
      }
      
      if (shiftX <= -200) {
        letGoBookmark(e);
        removeBookmarkFromArray(bookmark.id);
        editBookmarks("remove", bookmark);
        if (bookmarks.value.IDs.length === 0) toggleBookmarks();
      }
      
      if (shiftX >= 200) {
        letGoBookmark(e);
        shareBookmark(bookmark);
      }
    }

    function letGoBookmark(e) {
      pickedBookmark.removeEventListener('pointermove', coords);
      pickedBookmark.style.transform = `translateX(0px)`;
      pickedBookmark.style.transition = ``;
    }

    async function shareBookmark(bookmark) {
      const sharedData = {
        title: "Chuck's Jokes",
        text: "All Chuck Norris jokes in one place!",
        url: window.location.origin + "/shared?id=" + bookmark.id,
      }
      
      try {
        await navigator.share(sharedData);
      } catch (err) {
        console.log("Error during sharing bookmark: " + err);
      }
    }
  }

  function isInAnimation() {
    return [...document.querySelectorAll(".delete-animation-target")].length === 0 ? false : true;
  }

  function removeBookmarkFromArray(bookmark) {
    const indexOfBookmark = bookmarks.value.IDs.indexOf(bookmark);
    bookmarksElems.value.splice(indexOfBookmark, 1);
  }

  function toggleBookmarksWrapper() {
    toggleBookmarks();
    preventBookmarkUIHint("temp");
  }

  function showBookmarkUIHint(timeToExecute) {
    bookmarksElems.value[0].lastChild.classList.add("bookmark__main-content--with-hint");
    
    animationMemory.hintTimeout = setTimeout(() => {
      preventBookmarkUIHint("perm");
    }, timeToExecute);
  }

  function preventBookmarkUIHint(type) {
    if (animationMemory.hintTimeout === "completed") return;

    bookmarksElems.value[0].lastChild.classList.remove("bookmark__main-content--with-hint");
    
    switch (type) {
      case "perm":
        animationMemory.hintTimeout = "completed";
        localStorage.setItem("bookmarkUIHintIsCompleted", true);
        break;
      case "temp":
        clearTimeout(animationMemory.hintTimeout);
        break;
      default:
        console.log('preventBookmarkUIHint called with wrong argument. Expecting "perm" or "temp"');
    }
  }

  function collectBookmarkElem(elem, bookmark) {
    if (bookmarksElems.value.indexOf(elem) !== -1 || elem === null) return; 
    
    if (bookmarksElems.value.length === 0) {
      addBookmark("push");
      return;
    }

    switch (bookmark.timeStamp > bookmarksTimeStamps.value[0]) {
      case true:
        addBookmark("unshift");
        break;
      default:
        addBookmark("push");
    }

    function addBookmark(type) {
      switch (type === "push") {
        case true:
          bookmarksElems.value.push(elem);
          bookmarksTimeStamps.value.push(bookmark.timeStamp);
          break;
        default:
          bookmarksElems.value.unshift(elem);
          bookmarksTimeStamps.value.unshift(bookmark.timeStamp);
      }
    }
  }

  onActivated(() => {
    if (animationMemory.hintTimeout !== "completed" && !localStorage.getItem("bookmarkUIHintIsCompleted")) showBookmarkUIHint(3000);
  });

</script>

<template>
  <ul class="bookmarks__container" ref="bookmarksContainer">
    <Teleport to="body">
      <Transition name="btn">
        <Button v-if="bookmarksActive" @click="toggleBookmarksWrapper" class="bookmarks__button">hide bookmarks</Button>
      </Transition>
    </Teleport>
    
    <TransitionGroup @before-leave="onBeforeLeave" @after-leave="onAfterLeave">
      <li
        class="bookmarks__bookmark"
        v-for="bookmark in bookmarks.items"
        :key="bookmark.id"
        @pointerdown="slide($event, bookmark)"
        :ref="(el) => collectBookmarkElem(el, bookmark)"
      >
        <div class="bookmark__slide-menu">
          <div class="bookmark__option"><span class="material-symbols-outlined">ios_share</span></div>
          <div class="bookmark__option"><span class="material-symbols-outlined">delete</span></div>
        </div>
        <div class="bookmark__main-content">
          <p class="bookmark__joke">{{ bookmark.value }}</p>
          <div class="bookmark__info">
            <p class="bookmark__category">Category: {{ bookmark.category }}</p>
            <p class="bookmark__date">Added: {{ bookmark.addedToBookmarks }}</p>
          </div>
        </div>
      </li>
    </TransitionGroup>
  </ul>
</template>

<style scoped>
  .bookmarks__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
    user-select: none;
  }

  .bookmarks__bookmark {
    position: relative;
    width: 100%;
    max-width: 600px;
    margin-bottom: 10px;
    font-size: 30px;  
    cursor: pointer;
    touch-action: pan-y;
  }

  .bookmark__slide-menu {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    border: 2px solid rgba(255,115,115,1);
    border-radius: 10px;
    background: rgb(255,199,109);
    background: linear-gradient(90deg, rgba(255,199,109,1) 0%, rgba(255,115,115,1) 100%);
    z-index: -9999;
  }

  .bookmark__option > span {
    padding: 0 15px;
    font-size: 50px;
  }

  .bookmark__main-content {
    padding: 10px;
    border: 2px solid lightgray;
    border-radius: 10px;
    background-color: aliceblue;
    transition: transform 200ms ease-in-out;
  }

  .bookmark__main-content--with-hint {
    animation-delay: 1000ms;
    animation-direction: normal;
    animation-duration: 2000ms;
    animation-fill-mode: none;
    animation-iteration-count: 1;
    animation-name: bookmark-interface-hint;
    animation-timing-function: ease-in-out;
  }

  @keyframes bookmark-interface-hint {
    0% {
      transform: translateX(0px);
    }

    33% {
      transform: translateX(-100px);
    }

    66% {
      transform: translateX(100px);
    }

    100% {
      transform: translateX(0px);
    }
  }

  .bookmark__info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
  }

  .bookmark__date,
  .bookmark__category {
    color: rgba(0, 0, 0, 0.2);
    font-size: 15px;
  } 

  .bookmarks__button {
    position: fixed;
    top: 0;
    left: 50%;
    font-size: 20px;
    border: none;
    border-radius: 0 0 10px 10px;
    box-shadow: 0px 0px 10px 0px black;
    transform: translateX(-50%);
    transition-delay: 1000ms;
  }

  .btn-enter-active,
  .btn-leave-active {
    transition-property: all;
    transition-duration: 300ms;
    transition-timing-function: ease-in-out;
  }

  .btn-enter-from,
  .btn-leave-to {
    transform: translate(-50%, -130%);
  }

  .btn-leave-to {
    transition-delay: 0ms;
  }

  .bookmarks-list-move,
  .bookmarks-list-enter-active,
  .bookmarks-list-leave-active {
    transition: all 200ms ease-in-out;
  }

  .bookmarks-list-enter-from,
  .bookmarks-list-leave-to {
    opacity: 0;
    transform: translateX(-100%);
  }

  .bookmarks-list-leave-active {
    position: absolute;
  }

  .delete-animation-brothers,
  .delete-animation-target {
    transition: all 200ms ease-in-out;
  }

  .delete-animation-target {
    opacity: 0;
    transform: translateX(-100%);
  }

  </style>
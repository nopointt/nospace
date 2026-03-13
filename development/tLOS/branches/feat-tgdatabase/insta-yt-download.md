Для YouTube и Instagram через CLI оптимальный стек такой:

## YouTube (и тысячи других сайтов)

Для YouTube лучше всего использовать **yt-dlp** – форк youtube-dl, активно развивается, поддерживает кучу сайтов и форматов. [github](https://github.com/yt-dlp/yt-dlp)

Установка (Linux/macOS, бинарь в /usr/local/bin):

```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

Примеры использования:

```bash
# обычное видео в лучшем качестве
yt-dlp "https://www.youtube.com/watch?v=ID"

# выкачать плейлист
yt-dlp -o "%(playlist_index)s - %(title)s.%(ext)s" "https://www.youtube.com/playlist?list=ID"

# только аудио (mp3 через ffmpeg)
yt-dlp -x --audio-format mp3 "https://www.youtube.com/watch?v=ID"
```

Если хочешь оболочку над yt-dlp с удобными пресетами (аудио/видео, архив, инстаграм и др.), посмотри bash‑утилиту **yt**: она тонко настраивает yt-dlp и умеет работать и с Instagram, и с YouTube. [github](https://github.com/ddelange/yt)

```bash
# пример: m4a-аудио по URL из буфера обмена
yt
# пример: mp4-видео до 1080p
yt -vmM -- URL
```

## Instagram

Для Instagram есть два проверенных варианта CLI, оба open source.

### 1) Instaloader

Instaloader — Python-инструмент, который скачивает посты, сториз, хайлайты, аватарки и метаданные с Instagram. [bellingcat.gitbook](https://bellingcat.gitbook.io/toolkit/more/all-tools/instaloader)

Установка (если есть Python 3.8+):

```bash
pip3 install instaloader
```

Базовые команды:

```bash
# скачать все посты публичного аккаунта
instaloader profile USERNAME

# скачать один пост/риел по URL
instaloader https://www.instagram.com/p/POST_ID/

# скачать сториз, хайлайты и т.п. (потребуется логин)
instaloader --stories --highlights USERNAME
```

### 2) Instagram Downloader (Go)

Есть минималистичный Go‑CLI **insta-downloader**, который скачивает все фото аккаунта; подходит, если хочешь один бинарь без Python. [github](https://github.com/gschier/insta-downloader)

Установка:

```bash
curl -sf https://gobinaries.com/gschier/insta-downloader | sh
```

Использование:

```bash
insta-downloader ~/Downloads/instagram
# спросит логин/пароль и выкачаeт фото
```

## Юридический момент

При скачивании контента соблюдай авторские права и правила платформ (YouTube/Instagram могут запрещать скачивание для некоторых сценариев). [en.wikipedia](https://en.wikipedia.org/wiki/Youtube-dl)

Хочешь, я помогу собрать конкретный скрипт/alias под твой use‑case (например: “скачай все Reels из профиля X в папку и сконвертируй в mp4”)?
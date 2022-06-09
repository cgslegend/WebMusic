import Swiper from "./swiper";

import '../scss/index.scss'
import './icon.js'
import './swiper.js'

class Player {
    constructor(node) {
        this.root = typeof node === 'string' ? document.querySelector(node) : node
        this.f1 = selector => this.root.querySelector(selector)
        this.f2 = selector => this.root.querySelectorAll(selector)
        this.songList = []
        this.currentIndex = 0
        this.audio = new Audio()
        this.lyricsArr = []
        this.lyricIndex = -1
        this.start()
        this.bind()
    }

    start(){
        fetch('https://jirengu.github.io/data-mock/huawei-music/music-list.json')
            .then(res => res.json())
            .then(data => {
                this.songList = data
                this.loadSong()
            })
    }

    bind() {
        let self = this
        this.f1('.btn-play-pause').onclick = function () {
            if(this.classList.contains('playing')) {
                self.audio.pause()
                this.classList.remove('playing')
                this.classList.add('pause')
                this.querySelector('use').setAttribute('xlink:href', '#icon-play')
                let iconPause1 = self.f1(' .effect1')
                iconPause1.style.animationPlayState = 'paused'
                let iconPause2 = self.f1(' .effect2')
                iconPause2.style.animationPlayState = 'paused'
                let iconPause3 = self.f1(' .effect3')
                iconPause3.style.animationPlayState = 'paused'
            }else if (this.classList.contains('pause')) {
                self.audio.play()
                this.classList.remove('pause')
                this.classList.add('playing')
                this.querySelector('use').setAttribute('xlink:href', '#icon-pause' )
                let iconPause1 = self.f1(' .effect1')
                iconPause1.style.animationPlayState = 'running'
                let iconPause2 = self.f1(' .effect2')
                iconPause2.style.animationPlayState = 'running'
                let iconPause3 = self.f1(' .effect3')
                iconPause3.style.animationPlayState = 'running'
            }
        }

        this.f1('.btn-pre').onclick = function() {
            self.currentIndex = (self.songList.length + self.currentIndex - 1) % self.songList.length
            self.loadSong()
            self.playSong()
        }

        this.f1('.btn-next').onclick = function() {
            self.currentIndex = (self.currentIndex + 1) % self.songList.length
            self.loadSong()
            self.playSong()
        }

        this.audio.ontimeupdate = function () {
            self.locateLyric()
            self.setProgressBar()
        }

        let swiper = new Swiper(this.f1('.panels'))
        swiper.on('swipeLeft',function(){
            this.classList.remove('panel1')
            this.classList.add('panel2')
        })

        swiper.on('swipeRight',function(){
            this.classList.remove('panel2')
            this.classList.add('panel1')
        })
    }

    loadSong(){
        let songObj = this.songList[this.currentIndex]
        this.f1('header h1').innerText = songObj.title
        this.f1('header p').innerText = songObj.author + '-' + songObj.albumn
        this.audio.src = songObj.url
        this.audio.onloadedmetadata = () => this.f1('.time-end').innerText = this.formatTime(this.audio.duration)
        this.loadLyric()
        console.log('song loaded')
    }

    playSong(){
        this.audio.oncanplaythrough = () => this.audio.play()
    }

    loadLyric(){
        fetch(this.songList[this.currentIndex].lyric)
            .then(res => res.json())
            .then(data => {
                this.setLyrics(data.lrc.lyric)
                window.lyrics = data.lrc.lyricF
            })
    }

    locateLyric(){
        let currentTime = this.audio.currentTime*1000
        let nextLineTime = this.lyricsArr[this.lyricIndex+1][0]
        if(currentTime > nextLineTime && this.lyricIndex < this.lyricsArr.length - 1){
            this.lyricIndex++
            let node = this.f1('[data-time="'+this.lyricsArr[this.lyricIndex][0]+'"]')
            if(node) this.setLyricToCenter(node)
            this.f2('.panelEffect .lyric p')[0].innerText = this.lyricsArr[this.lyricIndex][1]
            this.f2('.panelEffect .lyric p')[1].innerText = this.lyricsArr[this.lyricIndex+1] ? this.lyricsArr[this.lyricIndex+1][1] : ''
        }
    }

    setLyrics(lyrics){
        this.lyricIndex = 0;
        let fragment = document.createDocumentFragment()
        let lyricsArr = []
        this.lyricsArr = lyricsArr
        lyrics.split(/\n/)
            .filter(str => str.match(/\[.+?\]/))
            .forEach(line => {
                let str = line.replace(/\[.+?\]/g, '')
                line.match(/\[.+?\]/g).forEach(t=>{
                    t = t.replace(/[\[\]]/g,'')
                    let milliseconds = parseInt(t.slice(0,2))*60*1000 + parseInt(t.slice(3,5))*1000 + parseInt(t.slice(6))
                    lyricsArr.push([milliseconds, str])
                })
            })

        lyricsArr.filter(line => line[1].trim() !== '').sort((v1, v2) => {
            if(v1[0] > v2[0]) {
                return 1
            } else {
                return -1
            }
        }).forEach(line => {
            let node = document.createElement('p')
            node.setAttribute('data-time', line[0])
            node.innerText = line[1]
            fragment.appendChild(node)
        })
        this.f1('.panelLyrics .container').innerHTML = ''
        this.f1('.panelLyrics .container').appendChild(fragment)
    }

    setLyricToCenter(node) {
        let translateY = node.offsetTop - this.f1('.panelLyrics').offsetHeight / 2
        translateY = translateY > 0 ? translateY : 0
        this.f1('.panelLyrics .container').style.transform = `translateY(-${translateY}px)`
        this.f2('.panelLyrics p').forEach(node => node.classList.remove('current'))
        node.classList.add('current')
    }

    setProgressBar() {
        let percent = (this.audio.currentTime * 100 /this.audio.duration) + '%'
        this.f1('.bar .progress').style.width = percent
        this.f1('.time-start').innerText = this.formatTime(this.audio.currentTime)
    }
    formatTime(secondsTotal) {
        let minutes = parseInt(secondsTotal/60)
        minutes = minutes >= 10 ? '' + minutes : '0' + minutes
        let seconds = parseInt(secondsTotal%60)
        seconds = seconds >= 10 ? '' + seconds : '0' + seconds
        return minutes + ':' + seconds
    }

}

window.p = new Player('#player')
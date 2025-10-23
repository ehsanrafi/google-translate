import { $ } from './dom.js'

class GoogleTranslator {
    static SUPPORTED_LANGUAGES = [
        'en',
        'es',
        'fr',
        'de',
        'it',
        'pt',
        'ru',
        'ja',
        'zh'
    ]

    static FULL_LANGUAGES_CODE = {
        es: 'es-Es',
        en: 'en-US',
        fr: 'fr-FR',
        de: 'de-DE',
        it: 'it-IT',
        pt: 'pt-PT',
        ru: 'ru-RU',
        ja: 'ja-JP',
        zh: 'zh-CN'
    }

    static DEFAULT_SOURCE_LANGUAGE = 'en'
    static DEFAULT_TARGET_LANGUAGE = 'es'

    constructor () {
        this.init()
        this.setupEventListeners()

        this.translationTimeout = null
        this.currentTranslator = null
        this.currentTranslatorKey = null
        this.currentDetector = null
    }

    init () {
        this.inputText = $('#inputText')
        this.outputText = $('#outputText')
        
        this.sourceLanguage = $('#sourceLanguage')
        this.targetLanguage = $('#targetLanguage')
        this.swapLanguages = $('#swapLanguages')

        this.micButton = $('#micButton')
        this.copyButton = $('#copyButton')
        this.speakerButton = $('#speakerButton')

        this.targetLanguage.value = GoogleTranslator.DEFAULT_TARGET_LANGUAGE;

        this.checkAPISupport()
    }

    checkAPISupport () {
        this.hasNativeTranslator = "Translator" in window
        this.hasNativeDetector = "LanguageDetector" in window

        if(!this.hasNativeTranslator || !this.hasNativeDetector) {
            console.warn("Native translation and language detection APIs are not supported in your browser.")
        } else {
            console.log("APIs Available!")
        }
    }

    setupEventListeners () {
        this.inputText.addEventListener('input', () => {
            this.debounceTranslate()
        })

        this.sourceLanguage.addEventListener('change', () => this.translate())
        this.targetLanguage.addEventListener('change', () => this.translate())
        
        this.swapLanguages.addEventListener('click', () => this.swapLanguages())
    }

    debounceTranslate() {
        clearTimeout(this.translationTimeout)
        this.translationTimeout = setTimeout(() => {
            this.translate()
        }, 500)
    }

    async getTranslation(text) {
        const sourceLanguage = this.sourceLanguage.value
        const targetLanguage = this.targetLanguage.value
    
        if (sourceLanguage === targetLanguage) return text
        
        try {
            const status = await window.Translator.availability({
                sourceLanguage,
                targetLanguage
            })

            if (status === 'unavailable') {
                throw new Error (`${sourceLanguage} translation to ${targetLanguage} not available!`)
            }
        } catch (error) {
            console.error(error)
            
            throw new Error (`${sourceLanguage} translation to ${targetLanguage} not available!`)
        }

        const translationKey = `${sourceLanguage}-${targetLanguage}`

        try {
            if (
                !this.currentTranslator &&
                this.currentTranslatorKey !== translationKey
            ) {
                this.currentTranslator = await window.Translator.create({
                    sourceLanguage,
                    targetLanguage,
                    monitor: (monitor) => {
                        monitor.addEventListener("downloadprogress", (e) => {
                            this.outputText.innerHTML = `<span class="loading">Downloading model: ${Math.floor(e.loaded / e.total * 100)}%</span>`
                        })
                    }
                })
            }
    
            this.currentTranslatorKey = translationKey
    
            const translation = await this.currentTranslator.translate(text)
            return translation
        } catch (error) {
            console.error(error)
            return 'Translation error!'
        }

    }

    async translate () {
        const text = this.inputText.value.trim()

        if(!text) {
            this.outputText.textContent = ''
            return
        }

        this.outputText.textContent = 'Translating...'

        try {
            const translation = await this.getTranslation(text)
            this.outputText.textContent = translation
        } catch (error) {
            console.error(error)
            const hasSupport = this.checkAPISupport()

            if (!hasSupport) {
                this.outputText.textContent = 'Error! API native translation not supported!'
                return
            }
        }
    }

    swapLanguages () {

    }
}

const googleTranslator = new GoogleTranslator()
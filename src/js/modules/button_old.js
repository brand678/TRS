import {
    url
} from "./ai/utils/url";
import gsap, {
    easeBlur,
    easeDirectional,
    easeGentleIn,
    easePrimary
} from "@/gsap";
import {
    html
} from '@/utils/environment';
import {
    Modal
} from "./Modal";
import {
    Accordion
} from "./Accordion";

const CLASS = {
    MODAL_OPEN: `has-modal-open`,
    AI_OPEN: `has-ai-open`,
    AI_THINKING: `has-ai-thinking`,
    AI_ERROR: `has-ai-error`,
}

export class Button {
    constructor() {
        this.form = document.querySelector("[data-ai='w']");
        if (!this.form) return;

        this.questionWrapper = this.form.querySelector(".question-w");
        this.question = this.form.querySelector(".question");
        this.background = this.questionWrapper.querySelector(".form__bg");
        this.button = this.form.querySelector("[data-module='button']");
        this.buttonIcon = this.button.querySelector(".ai__icon");
        this.buttonGradient = this.button.querySelector(".gradient");
        this.textArea = this.form.querySelector("textarea");
        this.submitButton = this.form.querySelector("[data-module='button']");
        this.textButton = this.form.querySelector(".btn__text");
        this.responseWrapper = this.form.querySelector(".response-w");
        this.responseField = this.form.querySelector("[data-ai='response']");
        this.dots = this.form.querySelectorAll(".ai__icon circle");
        this.questionLoaderWrapper = this.form.querySelector(".question__loader-w");
        this.questionLoaderCircles = this.form.querySelectorAll(".question__loader-w svg circle");
        this.responseTitle = this.form.querySelector("[data-ai='title']");
        // this.responseVisualWrapper = this.form.querySelector("[data-ai='visualWrapper']");
        this.responseVisual = this.form.querySelector("[data-ai='visual']");
        // this.responseOpen = this.form.querySelector("[data-ai='open']");

        this.$modal = document.querySelector("[data-ai='modal']");
        this.responseModalVisual = this.$modal.querySelector("[data-ai='modalVisual']");
        this.responseModalTitle = this.$modal.querySelector("[data-ai='modalTitle']");

        this.threadHistory = [];
        this.accordionWrapper = document.querySelector('.accordion-w');
        this.$accordion = document.querySelector("[data-ai='accordionWrapper']");

        this.assetsURL = "Project-Resources/Translink1.itsoffbrand.io/assets/ai-images/"


        // this.initializeElements();
        this.resetState();
        this.setupAnimations();
        this.initEventListeners();

        this.outsideClickBind = (e) => {
            if (!this.form.contains(e.target) && !this.$modal.contains(e.target)) {
                // if (!this.questionWrapper.contains(e.target)) {
                if (html.classList.contains(CLASS.AI_OPEN)) {
                    this.resetForm();
                }
            }
        };

        this.Modal = new Modal(this.$modal);
        this.accordions = [];
    }

    // initializeElements() {
    //   this.questionWrapper = this.form.querySelector(".question-w");
    //   this.question = this.form.querySelector(".question");
    //   this.background = this.questionWrapper.querySelector(".form__bg");
    //   this.button = this.form.querySelector("[data-module='button']");
    //   this.buttonIcon = this.button.querySelector(".ai__icon");
    //   this.buttonGradient = this.button.querySelector(".gradient");
    //   this.textArea = this.form.querySelector("textarea");
    //   this.submitButton = this.form.querySelector("[data-module='button']");
    //   this.textButton = this.form.querySelector(".btn__text");
    //   this.responseWrapper = this.form.querySelector(".response-w");
    //   this.responseField = this.form.querySelector("[data-ai='response']");
    //   this.dots = this.form.querySelectorAll(".ai__icon circle");
    //   this.questionLoaderWrapper = this.form.querySelector(".question__loader-w");
    //   this.questionLoaderCircles = this.form.querySelectorAll(".question__loader-w svg circle");
    // }

    resetState() {
        console.log("reset state");

        this.isInitialState = true;
        this.isNewQuestion = false;
        this.textArea.style.pointerEvents = "auto";
        this.questionLoaderWrapper.style.opacity = "0";
        this.form.classList.remove("is--thinking");
        this.submitButton.disabled = false;
        html.classList.remove(CLASS.AI_THINKING)
        html.classList.remove(CLASS.AI_ERROR)
        // this.responseOpen.style.visibility = "visible";
        // this.responseVisualWrapper.style.display = "block";
    }


    setupAnimations() {
        this.setupQuestionAnimation();
        this.setupThinkingAnimation();
        this.setupResponseAnimation();
        this.setupNewQuestionAnimation();
        this.setupReverseAnimation();
    }

    setupNewQuestionAnimation() {
        html.classList.remove(CLASS.AI_ERROR)
        this.tlNewQuestion = gsap.timeline({
                paused: true,
                defaults: {
                    duration: 0.6,
                    ease: easePrimary
                }
            })
            .to(this.responseWrapper, {
                opacity: 0,
                scale: 1.1,
                filter: "blur(0.5rem)",
                pointerEvents: "none"
            })
            // .to(this.questionLoaderWrapper, {
            //   opacity: 0,
            //   pointerEvents: "none",
            //   duration: 0.3
            // }, "<0.2")
            // .to(this.textArea, {
            //   color: "rgba(255, 255, 255, 1)",
            //   pointerEvents: "auto",
            //   paddingLeft: "2rem"
            // }, "<")
            .call(() => {
                this.responseField.innerHTML = "";
                this.textArea.value = "";
                this.textArea.focus();
                this.isInitialState = false;
                // this.responseOpen.style.visibility = "visible";
                // this.responseVisualWrapper.style.display = "block";
            });
    }


    setupQuestionAnimation() {
        this.tlQuestion = gsap.timeline({
                paused: true,
                defaults: {
                    duration: 0.8,
                    ease: easePrimary
                },
                onReverseComplete: () => {
                    this.textArea.value = "";
                }
            })
            .fromTo(this.background, {
                clipPath: "inset(12rem 0rem 0.4rem 0rem round 2.2rem)",
                // opacity: 1,
                // scale: 1,
                // filter: "blur(0rem)",
            }, {
                clipPath: "inset(0rem 0rem 0rem 0rem round 2.2rem)",
                // opacity: 1,
                // scale: 1,
                // filter: "blur(0rem)",
                clearProps: "clip-path",
                transformOrigin: "center center",
            })
            .fromTo(this.question, {
                clipPath: "inset(10.6rem 2.8rem 0.4rem 2.8rem round 2.2rem)",
            }, {
                clipPath: "inset(0rem 0rem 0rem 0rem round 2.2rem)",
                clearProps: "clip-path",
            }, "<")
            .fromTo(this.textArea, {
                scale: 0.8,
                opacity: 0,
                transformOrigin: "bottom center",
            }, {
                scale: 1,
                opacity: 1,
            }, ">-.4")
            .to(this.button, {
                "--button-background": "white",
                "--button-color": "rgba(41, 41, 41, 0.3)",
            }, "<")
            .to(this.buttonIcon, {
                rotate: 180,
            }, "<")
            .to(this.buttonGradient, {
                opacity: 0,
                onReverseComplete: () => {
                    gsap.to(this.textButton, {
                        textContent: "Ask Translink",
                    });
                }
            }, "<")
            .to(this.questionWrapper, {
                "--enterOpacity": 1,
            }, "<.4")
            .call(() => {
                this.textArea.focus();
            })
            .to(this.textButton, {
                textContent: "How can I guide you?",
            }, ">-0.4");
    }

    setupThinkingAnimation() {
        if (!this.dots || this.dots.length === 0) {
            return;
        }

        this.tlThinking = gsap.timeline({
                paused: true,
                defaults: {
                    duration: 0.8,
                    ease: easePrimary
                },
                onComplete: () => {
                    // gsap.set(this.background, {
                    //   opacity: 1,
                    //   scale: 1,
                    //   filter: "blur(0rem)",
                    //   clipPath: "inset(12rem 0rem 0.4rem 0rem round 2.2rem)",
                    // })
                }
            })
            .to(this.background, {
                opacity: 0,
                scale: 1.1,
                transformOrigin: "center center",
                filter: "blur(0.5rem)",
            }, "<")
            .to(this.textArea, {
                color: "rgba(255, 255, 255, 0)",
                pointerEvents: "none",
                paddingLeft: "6rem",
            }, "<")
            .to(this.question, {
                backgroundColor: "rgba(10, 26, 41, 0.6)",
                backdropFilter: "blur(0.5rem)",
            }, "<")
            .to(this.questionLoaderWrapper, {
                opacity: 1,
            }, ">");

        this.tlDots = gsap.timeline({
                paused: true,
            })
            .to(this.dots, {
                attr: {
                    cy: (i) => i % 2 ? 8 : 1
                },
                duration: 0.8,
                ease: easeGentleIn,
                stagger: {
                    each: 0.05,
                    from: "center",
                    repeat: -1,
                    yoyo: true
                }
            }, "<");
    }

    setupResponseAnimation() {
        if (this.tlResponse)
            this.tlResponse.kill();

        this.tlResponse = gsap.timeline({
                paused: true,
                defaults: {
                    duration: 0.8,
                    ease: easePrimary
                },
                onReverseComplete: () => {
                    // this.tlThinking.timeScale(1.5).reverse();
                },
                onComplete: () => {
                    gsap.set(this.background, {
                        opacity: 1,
                        scale: 1,
                        filter: "blur(0rem)",
                        clipPath: "inset(12rem 0rem 0.4rem 0rem round 2.2rem)",
                    })
                }
            })
            .fromTo(this.responseWrapper, {
                opacity: 0,
                filter: "blur(0.5rem)",
                scale: 1.1,
            }, {
                opacity: 1,
                filter: "blur(0rem)",
                scale: 1,
            });
    }

    setupReverseAnimation() {
        this.tlReverse = gsap.timeline({
                paused: true,
                defaults: {
                    duration: 0.6,
                    ease: easePrimary
                },
                onComplete: () => {
                    this.textArea.value = "";
                    gsap.set(this.questionWrapper, {
                        "--enterOpacity": 0,
                    })
                    gsap.set(this.questionLoaderWrapper, {
                        opacity: 0,
                    })
                    gsap.set(this.textArea, {
                        color: "rgba(255, 255, 255, 0)",
                        pointerEvents: "auto",
                        paddingLeft: "2rem",
                        color: "#050D15"
                    })
                    gsap.set(this.question, {
                        backgroundColor: "#f2f2f2",
                        backdropFilter: "blur(0rem)",
                    })
                }
            })
            .to(this.textArea, {
                scale: 0.8,
                opacity: 0,
                transformOrigin: "bottom center",
            }, "<")
            .to(this.question, {
                clipPath: "inset(10.6rem 2.8rem 0.4rem 2.8rem round 2.2rem)",
            }, ">-.1")
            .to(this.textButton, {
                textContent: "Ask Translink",
            }, "<")
            .to(this.button, {
                "--button-background": "rgba(10, 26, 41, 1)",
                "--button-color": "#fff",
            }, "<")
            .to(this.buttonIcon, {
                rotate: 0,
            }, "<")
            .to(this.buttonGradient, {
                opacity: 1,
            }, "<")
        // .to(this.questionWrapper, {
        //   "--enterOpacity": 0,
        // }, "<")
        // .to(this.questionLoaderWrapper, {
        //   opacity: 0,
        // }, "<")
        // .to(this.textArea, {
        //   color: "rgba(255, 255, 255, 0)",
        //   pointerEvents: "auto",
        //   paddingLeft: "2rem",
        //   color: "#050D15"
        // }, ">")
        // .to(this.question, {
        //   backgroundColor: "#f2f2f2",
        //   backdropFilter: "blur(0rem)",
        // }, ">")
    }

    initEventListeners() {
        this.submitButton.addEventListener("click", this.handleSubmitClick.bind(this));
        this.textArea.addEventListener("keydown", this.handleKeyDown.bind(this));
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.tlQuestion.progress() > 0) {
                this.resetForm()
            }
        })
    }

    handleSubmitClick() {
        if (this.isInitialState) {
            html.classList.add(CLASS.AI_OPEN)
            this.tlQuestion.restart();
            this.isInitialState = false;
            this.submitButton.disabled = true;
            document.addEventListener('click', this.outsideClickBind);
        } else {
            html.classList.remove(CLASS.AI_OPEN)
            if (html.classList.contains(CLASS.MODAL_OPEN)) {
                console.log("close modal");
                this.Modal.close()
            }

            this.startNewQuestion()
        }
    }

    startNewQuestion() {
        if (this.tlThinking.progress() > 0)
            this.tlThinking.timeScale(1.5).reverse();

        // this.tlNewQuestion.play();
        this.tlNewQuestion.restart();

        this.submitButton.disabled = false;
        this.textButton.textContent = "How can I guide you?";
        this.form.classList.remove("is--thinking");
        this.tlDots.pause().progress(0);

        this.isNewQuestion = true;
    }

    handleKeyDown(e) {
        // if (e.key === 'Escape') {
        //   this.resetForm();
        // }

        if (e.key === 'Enter') {
            e.preventDefault();
            this.handleEnterKey();
        }
    }

    resetForm() {
        html.classList.remove(CLASS.AI_OPEN)
        if (html.classList.contains(CLASS.MODAL_OPEN)) {
            console.log("close modal");

            this.Modal.close()
        }

        if (this.tlResponse.progress() > 0) {
            console.log("reset form", this.tlResponse.progress());

            // this.tlThinking.timeScale(1.5).reverse();
            // this.tlResponse.timeScale(1.5).reverse();
            // create a new timeline to handle the reverse of the response & thinking states
            this.tlReverse.restart();

            this.tlResponse.timeScale(1.5).reverse();
            // this.tlResponse.progress(0);
            // this.tlResponse.kill();
        } else {
            this.tlQuestion.timeScale(1.5).reverse();
        }

        this.resetState();

        // this.submitButton.disabled = false;
    }

    handleEnterKey() {
        if (this.textArea.value.length < 3)
            // need to add like a shake animation
            return;
        this.submitQuestion();
    }

    submitQuestion() {
        html.classList.add(CLASS.AI_THINKING)
        this.form.classList.add("is--thinking");
        this.textArea.blur();
        this.submitButton.disabled = true;
        this.textButton.textContent = "Thinking...";
        this.tlThinking.restart();
        this.tlDots.restart();
        // this.tlThinking.play();
        // this.tlDots.play();
        this.handleSubmission(this.textArea.value);
    }

    // handleSubmission(value) {
    //   // const data = "some lorem ipsum";
    //   this.displayResponse(value);
    // }

    async handleSubmission(value) {
        try {
            const response = await fetch(url(), {
                method: "POST",
                body: JSON.stringify({
                    question: value
                }),
            });

            const data = await response.json();
            this.storeResponse(value, data);
            this.displayResponse();

        } catch (error) {
            console.error("Submission error:", error);
            this.handleSubmissionError();
        }
    }

    storeResponse(question, data) {
        const rawResponse = data.result.content[0].text.value;

        const parts = rawResponse.split(' | ');
        const relevant = parts.length >= 3;
        if (parts.length < 3) {
            // hide open modal link
            // this.responseOpen.style.visibility = "hidden";
            //hide small image
            // this.responseVisualWrapper.style.display = "none";

            // Fallback if question is not relevant, like test...
            this.threadHistory.push({
                relevant: relevant,
                question: question,
                title: "Oops!",
                content: rawResponse,
                raw: rawResponse
            });
            return;
        }

        const [title, short, long, media, cta] = rawResponse.split(' | ');
        // const [title, shortResponse, image] = rawResponse.split(' | ');
        // const content = contentParts.join(' | ');
        // const shortResponse = content.split('.')[0] + '.';

        this.threadHistory.push({
            relevant,
            question,
            title,
            short,
            long,
            media,
            cta,
            raw: rawResponse, // jjust in case
            timestamp: new Date() // not sure if we need the timestamp
        });

        // each time we push a response, we create an accordion with the question and response
        // if (this.accordionWrapper) {
        //   // Clear existing content if needed
        //   // accordionWrapper.innerHTML = '';

        //   // Add accordions
        //   this.accordionWrapper.appendChild(this.createAccordion('First Item', 'Content for the first accordion'));
        // }
    }

    createAccordion(title = '', content = '') {
        const accordion = document.createElement('details');
        accordion.className = 'accordion';

        accordion.innerHTML = `
      <summary class="accordion__summary">
        <div class="accordion__title">${title}</div>
        <div class="accordion__arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 10 6" fill="none">
            <path d="M1.19531 1.17749L5.19531 5.17749L9.19531 1.17749" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </div>
      </summary>
      <div class="accordion__content">
        <p>${content}</p>
      </div>
    `;

        return accordion;
    }

    displayResponse(data) {
        html.classList.remove(CLASS.AI_THINKING)
        this.form.classList.remove("is--thinking");
        gsap.to(this.textArea, {
            color: "rgba(255, 255, 255, 0.5)"
        });
        gsap.to(this.questionLoaderCircles, {
            stroke: "#8B929A"
        });
        this.tlDots.pause().progress(0);

        if (this.tlNewQuestion.progress() > 0) {
            this.tlNewQuestion.reverse();
        }
        // this.tlResponse.play().progress(0);
        this.tlResponse.restart();
        this.submitButton.disabled = false;
        // this.responseField.innerHTML = data.result.content[0].text.value;
        this.textButton.textContent = "Another question?";

        // Display the most recent response
        if (this.threadHistory.length > 0) {
            const latest = this.threadHistory[this.threadHistory.length - 1];
            console.log(latest.question, latest.title, latest.short, latest.long, latest.media, latest.cta);
            this.responseField.innerHTML = `${latest.short}`;
            this.responseTitle.innerHTML = `${latest.title}`;
            this.responseModalTitle.innerHTML = `${latest.title}`;
            // temporary until getting final images

            // Media: IMG or VIDEO
            this.responseVisual.src = `Project-Resources/Translink1.itsoffbrand.io/assets/ai-images/${latest.media}.webp`;
            this.responseModalVisual.src = `Project-Resources/Translink1.itsoffbrand.io/assets/ai-images/${latest.media}.webp`;

            // if irrelevant, remove from the array
            if (!latest.relevant) {
                this.threadHistory.splice(this.threadHistory.length - 1, 1);
            } else {
                const accordionElement = this.createAccordion(latest.question, latest.long);

                this.accordionWrapper.appendChild(accordionElement);

                const accordion = new Accordion(accordionElement);
                accordion.init();
                this.accordions.push(accordion);
            }

        }


    }

    handleSubmissionError() {
        html.classList.add(CLASS.AI_ERROR)
        html.classList.remove(CLASS.AI_THINKING)
        this.form.classList.remove("is--thinking");
        gsap.to(this.textArea, {
            color: "rgba(255, 255, 255, 0.5)"
        });
        gsap.to(this.questionLoaderCircles, {
            stroke: "#8B929A"
        });
        this.tlDots.pause().progress(0);
        this.submitButton.disabled = false;
        this.textButton.textContent = "ðŸ˜µ  Uh oh :( Try again...";
    }
}
require('aframe');
require('aframe-extras');
require('aframe-event-set-component');
require('aframe-log-component');
require('aframe-plot-component');
require('aframe-ui-widgets');

require('./components/aframe-parent-constraint');
require('./components/helper');

  AFRAME.registerComponent('interaction-hands', {
    init: function () {
        this.otherHand = null;

        this.stretching = false;
        this.grabbing = false;

        this.hoverEls = [];

        this.grabElement = null;

        this.onHit = this.onHit.bind(this)
        this.onHitEnd = this.onHitEnd.bind(this)
        this.onGrab = this.onGrab.bind(this)
        this.onGrabEnd = this.onGrabEnd.bind(this)

        this.system.registerMe(this);
    },
    update: function() {
        this.registerListeners();
    },
    registerListeners: function() {
        this.el.addEventListener('hit', this.onHit)
        this.el.addEventListener('triggerdown', this.onGrab)
        this.el.addEventListener('triggerup', this.onGrabEnd)
        this.el.addEventListener('hitend', this.onHitEnd)
    },
    onGrab: function() {
        // only grab if hovering over an element
        if (this.hoverEls.length > 0) {
            // grab first element
            this.grabElement = this.hoverEls[0];
            this.grabbing = true;
            // if both hands are grabbing the same element: start strechting
            if (this.grabElement == this.otherHand.grabElement) {
                this.onStretchStart();
            } else {
                // parent to this hand
                this.grabElement.setAttribute("parent-constraint", {
                    parent: this.el
                })
            }
        }
    },
    onGrabEnd: function() {
        this.grabbing = false;
        if (this.grabElement != null) {
            this.grabElement.removeAttribute("parent-constraint");
            this.grabElement = null;
            this.onStretchEnd();
        }
        if (this.otherHand.grabbing) {
            this.otherHand.grabElement.setAttribute("parent-constraint", {
                parent: this.otherHand.el
            })
        }
    },
    onStretchEnd: function() {
        this.stretching = false;
        this.el.removeAttribute("middle");
        this.el.removeAttribute("stretch")
        this.otherHand.el.removeAttribute("middle");
        this.otherHand.el.removeAttribute("stretch")
    },
    onStretchStart: function() {
        this.stretching = true;
        
        // create middle point between hands
        this.el.setAttribute("middle", {
            otherhand: this.otherHand.el
        });
        // parent element to middle between hands
        this.grabElement.setAttribute("parent-constraint", {
            parent: this.el.components["middle"].center
        });

        // activate stretching
        this.el.setAttribute("stretch", {
            otherhand: this.otherHand.el,
            target: this.grabElement,
            activatedOnInit: true
        })
        
    },
    onHit: function(evt) {
        const hitEl = evt.detail.el
        if (!hitEl) { return }
        if (Array.isArray(hitEl)) {
            for (let i = 0, sect; i < hitEl.length; i++) {
                sect = evt.detail.intersections && evt.detail.intersections[i]
                this.hoverStart(hitEl[i], sect)
            }
        } else {
            this.hoverStart(hitEl, null)
        }
    },
    onHitEnd: function(evt) {
        const clearedEls = evt.detail.el
        if (clearedEls) {
            if (Array.isArray(clearedEls)) {
                clearedEls.forEach(el => this.hoverEnd(el))
            } else {
                this.hoverEnd(clearedEls)
            }
        }
    },
    hoverStart: function(hitEl, intersection) {
        const hitElIndex = this.hoverEls.indexOf(hitEl)
        if (hitElIndex === -1) {
            this.hoverEls.push(hitEl)
            // only emit hover start if first hover
            if (this.otherHand.hoverEls.indexOf(hitEl) === -1) {
                hitEl.emit('hover-start')
            }
        }
    },
    hoverEnd: function(target) {
        var hoverIndex = this.hoverEls.indexOf(target)
        if (hoverIndex !== -1) {
            // only emit if all hands left
            if (this.otherHand.hoverEls.indexOf(target) === -1) {
                this.hoverEls[hoverIndex].emit('hover-end')
            }
            this.hoverEls.splice(hoverIndex, 1)
        }
    }
  })


AFRAME.registerSystem('interaction-hands', {
    init: function () {
      this.interactionHands = []
    },
    registerMe: function (comp) {
      // when second hand registers, store links
      if (this.interactionHands.length === 1) {
        this.interactionHands[0].otherHand = comp
        comp.otherHand = this.interactionHands[0]
      }
      this.interactionHands.push(comp)
    },
    unregisterMe: function (comp) {
      var index = this.interactionHands.indexOf(comp)
      if (index !== -1) {
        this.interactionHands.splice(index, 1)
      }
      this.interactionHands.forEach(x => {
        if (x.otherHand === comp) { x.otherHand = null }
      })
    }
  })


 
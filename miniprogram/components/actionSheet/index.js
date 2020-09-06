Component({
    properties: {
        visible: {
            type: Boolean,
            value: false,
            observer(newVal) {
                if (newVal) {
                    this.setData({
                        visible: true,
                        animationMask: 'fadeIn',
                        animationSheet: 'fadeInBottom'
                    })
                } else {
                    this.setData({
                        visible: false,
                        animationMask: 'fadeOut',
                        animationSheet: 'fadeOutBottom'
                    })
                }
            }
        },
        closeText: {
            type: String,
            value: '取消'
        }
    },

    data: {
        animationMask: 'fadeIn',
        animationSheet: 'fadeInBottom'
    },

    methods: {
        closeActionSheet() {
            this.setData({
                animationMask: 'fadeOut',
                animationSheet: 'fadeOutBottom'
            })
            setTimeout(() => {
                this.setData({
                    visible: false
                })
            }, 300)
        }
    }
})
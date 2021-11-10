module.exports = {
  _adminAction : '',
  get adminAction() {
    return this._adminAction
  },
  set adminAction(action) {
    if (['confirm', 'reject'].includes(action)) {
      this._adminAction = action
    }
  }
}
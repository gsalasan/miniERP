'use client';

import Swal from 'sweetalert2';
import NProgress from 'nprogress';

type Position =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'center-start'
  | 'center'
  | 'center-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end';

export default {
  /** --------------------------------------
   * LOADING OVERLAY
   * -------------------------------------- */
  loadingOverlay(show = true, msg = '') {
    if (show) {
      Swal.fire({
        title: msg || 'Loading...',
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
        backdrop: true
      });
    } else {
      Swal.close();
    }
  },

  /** --------------------------------------
   * LOADING BAR (NProgress)
   * -------------------------------------- */
  loading(show = true) {
    NProgress.configure({ showSpinner: false });
    if (show) NProgress.start();
    else NProgress.done();
  },

  /** --------------------------------------
   * TOAST (SweetAlert2)
   * -------------------------------------- */
  showToast(
    msg: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    position: Position = 'top-end',
    timer = 3000,
    showCloseButton = true
  ) {
    Swal.fire({
      toast: true,
      position: position,
      icon: type,
      title: msg,
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      showCloseButton: showCloseButton,
      didOpen: (toastEl) => {
        toastEl.addEventListener('mouseenter', Swal.stopTimer);
        toastEl.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
  },

  success(msg: string, position?: Position, timer?: number) {
    this.showToast(msg, 'success', position, timer);
  },
  error(msg: string, position?: Position, timer?: number) {
    this.showToast(msg, 'error', position, timer);
  },
  warning(msg: string, position?: Position, timer?: number) {
    this.showToast(msg, 'warning', position, timer);
  },
  info(msg: string, position?: Position, timer?: number) {
    this.showToast(msg, 'info', position, timer);
  },

  /** --------------------------------------
   * ALERT DIALOG
   * -------------------------------------- */
  showAlert(title: string, msg = '', persistent = false) {
    Swal.fire({
      icon: 'info',
      title,
      html: msg,
      allowOutsideClick: !persistent
    });
  },

  showErrorDialog(e: string, json?: JSON) {
    let err = e;
    if (json) err = JSON.stringify(e);

    Swal.fire({
      icon: 'error',
      title: 'ERROR',
      html: err
    });
  },

  confirm(message: string, callback: any, options: any = undefined, prompt: any = undefined) {
    Swal.fire({
      title: 'Confirm',
      html: message,
      showCancelButton: true,
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      input: prompt ? prompt.type : undefined,
      inputOptions: options,
      inputValue: prompt ? prompt.default : undefined
    }).then((res) => {
      callback(res.isConfirmed, res.value);
    });
  }
};

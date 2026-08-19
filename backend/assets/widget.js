var wu = Object.defineProperty;
var ku = (e, t, n) => t in e ? wu(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Je = (e, t, n) => ku(e, typeof t != "symbol" ? t + "" : t, n);
/**
* @vue/shared v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function ro(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const Qe = {}, ns = [], on = () => {
}, xu = () => !1, zi = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), oo = (e) => e.startsWith("onUpdate:"), bt = Object.assign, ao = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, Au = Object.prototype.hasOwnProperty, qe = (e, t) => Au.call(e, t), pe = Array.isArray, ss = (e) => Hi(e) === "[object Map]", ul = (e) => Hi(e) === "[object Set]", _e = (e) => typeof e == "function", ct = (e) => typeof e == "string", Mn = (e) => typeof e == "symbol", it = (e) => e !== null && typeof e == "object", fl = (e) => (it(e) || _e(e)) && _e(e.then) && _e(e.catch), hl = Object.prototype.toString, Hi = (e) => hl.call(e), Tu = (e) => Hi(e).slice(8, -1), dl = (e) => Hi(e) === "[object Object]", lo = (e) => ct(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Ps = /* @__PURE__ */ ro(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), qi = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return (n) => t[n] || (t[n] = e(n));
}, Su = /-(\w)/g, On = qi(
  (e) => e.replace(Su, (t, n) => n ? n.toUpperCase() : "")
), Eu = /\B([A-Z])/g, Fn = qi(
  (e) => e.replace(Eu, "-$1").toLowerCase()
), pl = qi((e) => e.charAt(0).toUpperCase() + e.slice(1)), gr = qi(
  (e) => e ? `on${pl(e)}` : ""
), In = (e, t) => !Object.is(e, t), mi = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, Fr = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, Dr = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
};
let ca;
const Wi = () => ca || (ca = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function ke(e) {
  if (pe(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], i = ct(s) ? Lu(s) : ke(s);
      if (i)
        for (const r in i)
          t[r] = i[r];
    }
    return t;
  } else if (ct(e) || it(e))
    return e;
}
const Cu = /;(?![^(]*\))/g, Ru = /:([^]+)/, Iu = /\/\*[^]*?\*\//g;
function Lu(e) {
  const t = {};
  return e.replace(Iu, "").split(Cu).forEach((n) => {
    if (n) {
      const s = n.split(Ru);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function Fe(e) {
  let t = "";
  if (ct(e))
    t = e;
  else if (pe(e))
    for (let n = 0; n < e.length; n++) {
      const s = Fe(e[n]);
      s && (t += s + " ");
    }
  else if (it(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const Ou = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", Nu = /* @__PURE__ */ ro(Ou);
function gl(e) {
  return !!e || e === "";
}
const ml = (e) => !!(e && e.__v_isRef === !0), Q = (e) => ct(e) ? e : e == null ? "" : pe(e) || it(e) && (e.toString === hl || !_e(e.toString)) ? ml(e) ? Q(e.value) : JSON.stringify(e, _l, 2) : String(e), _l = (e, t) => ml(t) ? _l(e, t.value) : ss(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, i], r) => (n[mr(s, r) + " =>"] = i, n),
    {}
  )
} : ul(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => mr(n))
} : Mn(t) ? mr(t) : it(t) && !pe(t) && !dl(t) ? String(t) : t, mr = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Mn(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Nt;
class Pu {
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this.parent = Nt, !t && Nt && (this.index = (Nt.scopes || (Nt.scopes = [])).push(
      this
    ) - 1);
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++)
          this.scopes[t].pause();
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, n;
      if (this.scopes)
        for (t = 0, n = this.scopes.length; t < n; t++)
          this.scopes[t].resume();
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const n = Nt;
      try {
        return Nt = this, t();
      } finally {
        Nt = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = Nt, Nt = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    this._on > 0 && --this._on === 0 && (Nt = this.prevScope, this.prevScope = void 0);
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let n, s;
      for (n = 0, s = this.effects.length; n < s; n++)
        this.effects[n].stop();
      for (this.effects.length = 0, n = 0, s = this.cleanups.length; n < s; n++)
        this.cleanups[n]();
      if (this.cleanups.length = 0, this.scopes) {
        for (n = 0, s = this.scopes.length; n < s; n++)
          this.scopes[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const i = this.parent.scopes.pop();
        i && i !== this && (this.parent.scopes[this.index] = i, i.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function Mu() {
  return Nt;
}
let nt;
const _r = /* @__PURE__ */ new WeakSet();
class yl {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, Nt && Nt.active && Nt.effects.push(this);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, _r.has(this) && (_r.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || bl(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, ua(this), wl(this);
    const t = nt, n = Qt;
    nt = this, Qt = !0;
    try {
      return this.fn();
    } finally {
      kl(this), nt = t, Qt = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        fo(t);
      this.deps = this.depsTail = void 0, ua(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? _r.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    Br(this) && this.run();
  }
  get dirty() {
    return Br(this);
  }
}
let vl = 0, Ms, Fs;
function bl(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = Fs, Fs = e;
    return;
  }
  e.next = Ms, Ms = e;
}
function co() {
  vl++;
}
function uo() {
  if (--vl > 0)
    return;
  if (Fs) {
    let t = Fs;
    for (Fs = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; Ms; ) {
    let t = Ms;
    for (Ms = void 0; t; ) {
      const n = t.next;
      if (t.next = void 0, t.flags &= -9, t.flags & 1)
        try {
          t.trigger();
        } catch (s) {
          e || (e = s);
        }
      t = n;
    }
  }
  if (e) throw e;
}
function wl(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function kl(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const i = s.prevDep;
    s.version === -1 ? (s === n && (n = i), fo(s), Fu(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = i;
  }
  e.deps = t, e.depsTail = n;
}
function Br(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (xl(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function xl(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Hs) || (e.globalVersion = Hs, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Br(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = nt, s = Qt;
  nt = e, Qt = !0;
  try {
    wl(e);
    const i = e.fn(e._value);
    (t.version === 0 || In(i, e._value)) && (e.flags |= 128, e._value = i, t.version++);
  } catch (i) {
    throw t.version++, i;
  } finally {
    nt = n, Qt = s, kl(e), e.flags &= -3;
  }
}
function fo(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: i } = e;
  if (s && (s.nextSub = i, e.prevSub = void 0), i && (i.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let r = n.computed.deps; r; r = r.nextDep)
      fo(r, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Fu(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Qt = !0;
const Al = [];
function bn() {
  Al.push(Qt), Qt = !1;
}
function wn() {
  const e = Al.pop();
  Qt = e === void 0 ? !0 : e;
}
function ua(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = nt;
    nt = void 0;
    try {
      t();
    } finally {
      nt = n;
    }
  }
}
let Hs = 0;
class Du {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class ho {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!nt || !Qt || nt === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== nt)
      n = this.activeLink = new Du(nt, this), nt.deps ? (n.prevDep = nt.depsTail, nt.depsTail.nextDep = n, nt.depsTail = n) : nt.deps = nt.depsTail = n, Tl(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = nt.depsTail, n.nextDep = void 0, nt.depsTail.nextDep = n, nt.depsTail = n, nt.deps === n && (nt.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, Hs++, this.notify(t);
  }
  notify(t) {
    co();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      uo();
    }
  }
}
function Tl(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        Tl(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const $r = /* @__PURE__ */ new WeakMap(), jn = Symbol(
  ""
), Ur = Symbol(
  ""
), qs = Symbol(
  ""
);
function yt(e, t, n) {
  if (Qt && nt) {
    let s = $r.get(e);
    s || $r.set(e, s = /* @__PURE__ */ new Map());
    let i = s.get(n);
    i || (s.set(n, i = new ho()), i.map = s, i.key = n), i.track();
  }
}
function mn(e, t, n, s, i, r) {
  const o = $r.get(e);
  if (!o) {
    Hs++;
    return;
  }
  const a = (l) => {
    l && l.trigger();
  };
  if (co(), t === "clear")
    o.forEach(a);
  else {
    const l = pe(e), d = l && lo(n);
    if (l && n === "length") {
      const c = Number(s);
      o.forEach((w, k) => {
        (k === "length" || k === qs || !Mn(k) && k >= c) && a(w);
      });
    } else
      switch ((n !== void 0 || o.has(void 0)) && a(o.get(n)), d && a(o.get(qs)), t) {
        case "add":
          l ? d && a(o.get("length")) : (a(o.get(jn)), ss(e) && a(o.get(Ur)));
          break;
        case "delete":
          l || (a(o.get(jn)), ss(e) && a(o.get(Ur)));
          break;
        case "set":
          ss(e) && a(o.get(jn));
          break;
      }
  }
  uo();
}
function Qn(e) {
  const t = He(e);
  return t === e ? t : (yt(t, "iterate", qs), Vt(e) ? t : t.map(mt));
}
function ji(e) {
  return yt(e = He(e), "iterate", qs), e;
}
const Bu = {
  __proto__: null,
  [Symbol.iterator]() {
    return yr(this, Symbol.iterator, mt);
  },
  concat(...e) {
    return Qn(this).concat(
      ...e.map((t) => pe(t) ? Qn(t) : t)
    );
  },
  entries() {
    return yr(this, "entries", (e) => (e[1] = mt(e[1]), e));
  },
  every(e, t) {
    return hn(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return hn(this, "filter", e, t, (n) => n.map(mt), arguments);
  },
  find(e, t) {
    return hn(this, "find", e, t, mt, arguments);
  },
  findIndex(e, t) {
    return hn(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return hn(this, "findLast", e, t, mt, arguments);
  },
  findLastIndex(e, t) {
    return hn(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return hn(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return vr(this, "includes", e);
  },
  indexOf(...e) {
    return vr(this, "indexOf", e);
  },
  join(e) {
    return Qn(this).join(e);
  },
  // keys() iterator only reads `length`, no optimisation required
  lastIndexOf(...e) {
    return vr(this, "lastIndexOf", e);
  },
  map(e, t) {
    return hn(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return ys(this, "pop");
  },
  push(...e) {
    return ys(this, "push", e);
  },
  reduce(e, ...t) {
    return fa(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return fa(this, "reduceRight", e, t);
  },
  shift() {
    return ys(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return hn(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return ys(this, "splice", e);
  },
  toReversed() {
    return Qn(this).toReversed();
  },
  toSorted(e) {
    return Qn(this).toSorted(e);
  },
  toSpliced(...e) {
    return Qn(this).toSpliced(...e);
  },
  unshift(...e) {
    return ys(this, "unshift", e);
  },
  values() {
    return yr(this, "values", mt);
  }
};
function yr(e, t, n) {
  const s = ji(e), i = s[t]();
  return s !== e && !Vt(e) && (i._next = i.next, i.next = () => {
    const r = i._next();
    return r.value && (r.value = n(r.value)), r;
  }), i;
}
const $u = Array.prototype;
function hn(e, t, n, s, i, r) {
  const o = ji(e), a = o !== e && !Vt(e), l = o[t];
  if (l !== $u[t]) {
    const w = l.apply(e, r);
    return a ? mt(w) : w;
  }
  let d = n;
  o !== e && (a ? d = function(w, k) {
    return n.call(this, mt(w), k, e);
  } : n.length > 2 && (d = function(w, k) {
    return n.call(this, w, k, e);
  }));
  const c = l.call(o, d, s);
  return a && i ? i(c) : c;
}
function fa(e, t, n, s) {
  const i = ji(e);
  let r = n;
  return i !== e && (Vt(e) ? n.length > 3 && (r = function(o, a, l) {
    return n.call(this, o, a, l, e);
  }) : r = function(o, a, l) {
    return n.call(this, o, mt(a), l, e);
  }), i[t](r, ...s);
}
function vr(e, t, n) {
  const s = He(e);
  yt(s, "iterate", qs);
  const i = s[t](...n);
  return (i === -1 || i === !1) && mo(n[0]) ? (n[0] = He(n[0]), s[t](...n)) : i;
}
function ys(e, t, n = []) {
  bn(), co();
  const s = He(e)[t].apply(e, n);
  return uo(), wn(), s;
}
const Uu = /* @__PURE__ */ ro("__proto__,__v_isRef,__isVue"), Sl = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Mn)
);
function zu(e) {
  Mn(e) || (e = String(e));
  const t = He(this);
  return yt(t, "has", e), t.hasOwnProperty(e);
}
class El {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, s) {
    if (n === "__v_skip") return t.__v_skip;
    const i = this._isReadonly, r = this._isShallow;
    if (n === "__v_isReactive")
      return !i;
    if (n === "__v_isReadonly")
      return i;
    if (n === "__v_isShallow")
      return r;
    if (n === "__v_raw")
      return s === (i ? r ? Zu : Ll : r ? Il : Rl).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const o = pe(t);
    if (!i) {
      let l;
      if (o && (l = Bu[n]))
        return l;
      if (n === "hasOwnProperty")
        return zu;
    }
    const a = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      vt(t) ? t : s
    );
    return (Mn(n) ? Sl.has(n) : Uu(n)) || (i || yt(t, "get", n), r) ? a : vt(a) ? o && lo(n) ? a : a.value : it(a) ? i ? Ol(a) : Vi(a) : a;
  }
}
class Cl extends El {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, i) {
    let r = t[n];
    if (!this._isShallow) {
      const l = Nn(r);
      if (!Vt(s) && !Nn(s) && (r = He(r), s = He(s)), !pe(t) && vt(r) && !vt(s))
        return l ? !1 : (r.value = s, !0);
    }
    const o = pe(t) && lo(n) ? Number(n) < t.length : qe(t, n), a = Reflect.set(
      t,
      n,
      s,
      vt(t) ? t : i
    );
    return t === He(i) && (o ? In(s, r) && mn(t, "set", n, s) : mn(t, "add", n, s)), a;
  }
  deleteProperty(t, n) {
    const s = qe(t, n);
    t[n];
    const i = Reflect.deleteProperty(t, n);
    return i && s && mn(t, "delete", n, void 0), i;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!Mn(n) || !Sl.has(n)) && yt(t, "has", n), s;
  }
  ownKeys(t) {
    return yt(
      t,
      "iterate",
      pe(t) ? "length" : jn
    ), Reflect.ownKeys(t);
  }
}
class Hu extends El {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, n) {
    return !0;
  }
  deleteProperty(t, n) {
    return !0;
  }
}
const qu = /* @__PURE__ */ new Cl(), Wu = /* @__PURE__ */ new Hu(), ju = /* @__PURE__ */ new Cl(!0);
const zr = (e) => e, li = (e) => Reflect.getPrototypeOf(e);
function Vu(e, t, n) {
  return function(...s) {
    const i = this.__v_raw, r = He(i), o = ss(r), a = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, d = i[e](...s), c = n ? zr : t ? Ii : mt;
    return !t && yt(
      r,
      "iterate",
      l ? Ur : jn
    ), {
      // iterator protocol
      next() {
        const { value: w, done: k } = d.next();
        return k ? { value: w, done: k } : {
          value: a ? [c(w[0]), c(w[1])] : c(w),
          done: k
        };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
function ci(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function Ku(e, t) {
  const n = {
    get(i) {
      const r = this.__v_raw, o = He(r), a = He(i);
      e || (In(i, a) && yt(o, "get", i), yt(o, "get", a));
      const { has: l } = li(o), d = t ? zr : e ? Ii : mt;
      if (l.call(o, i))
        return d(r.get(i));
      if (l.call(o, a))
        return d(r.get(a));
      r !== o && r.get(i);
    },
    get size() {
      const i = this.__v_raw;
      return !e && yt(He(i), "iterate", jn), Reflect.get(i, "size", i);
    },
    has(i) {
      const r = this.__v_raw, o = He(r), a = He(i);
      return e || (In(i, a) && yt(o, "has", i), yt(o, "has", a)), i === a ? r.has(i) : r.has(i) || r.has(a);
    },
    forEach(i, r) {
      const o = this, a = o.__v_raw, l = He(a), d = t ? zr : e ? Ii : mt;
      return !e && yt(l, "iterate", jn), a.forEach((c, w) => i.call(r, d(c), d(w), o));
    }
  };
  return bt(
    n,
    e ? {
      add: ci("add"),
      set: ci("set"),
      delete: ci("delete"),
      clear: ci("clear")
    } : {
      add(i) {
        !t && !Vt(i) && !Nn(i) && (i = He(i));
        const r = He(this);
        return li(r).has.call(r, i) || (r.add(i), mn(r, "add", i, i)), this;
      },
      set(i, r) {
        !t && !Vt(r) && !Nn(r) && (r = He(r));
        const o = He(this), { has: a, get: l } = li(o);
        let d = a.call(o, i);
        d || (i = He(i), d = a.call(o, i));
        const c = l.call(o, i);
        return o.set(i, r), d ? In(r, c) && mn(o, "set", i, r) : mn(o, "add", i, r), this;
      },
      delete(i) {
        const r = He(this), { has: o, get: a } = li(r);
        let l = o.call(r, i);
        l || (i = He(i), l = o.call(r, i)), a && a.call(r, i);
        const d = r.delete(i);
        return l && mn(r, "delete", i, void 0), d;
      },
      clear() {
        const i = He(this), r = i.size !== 0, o = i.clear();
        return r && mn(
          i,
          "clear",
          void 0,
          void 0
        ), o;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((i) => {
    n[i] = Vu(i, e, t);
  }), n;
}
function po(e, t) {
  const n = Ku(e, t);
  return (s, i, r) => i === "__v_isReactive" ? !e : i === "__v_isReadonly" ? e : i === "__v_raw" ? s : Reflect.get(
    qe(n, i) && i in s ? n : s,
    i,
    r
  );
}
const Gu = {
  get: /* @__PURE__ */ po(!1, !1)
}, Yu = {
  get: /* @__PURE__ */ po(!1, !0)
}, Xu = {
  get: /* @__PURE__ */ po(!0, !1)
};
const Rl = /* @__PURE__ */ new WeakMap(), Il = /* @__PURE__ */ new WeakMap(), Ll = /* @__PURE__ */ new WeakMap(), Zu = /* @__PURE__ */ new WeakMap();
function Ju(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function Qu(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : Ju(Tu(e));
}
function Vi(e) {
  return Nn(e) ? e : go(
    e,
    !1,
    qu,
    Gu,
    Rl
  );
}
function ef(e) {
  return go(
    e,
    !1,
    ju,
    Yu,
    Il
  );
}
function Ol(e) {
  return go(
    e,
    !0,
    Wu,
    Xu,
    Ll
  );
}
function go(e, t, n, s, i) {
  if (!it(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const r = Qu(e);
  if (r === 0)
    return e;
  const o = i.get(e);
  if (o)
    return o;
  const a = new Proxy(
    e,
    r === 2 ? s : n
  );
  return i.set(e, a), a;
}
function is(e) {
  return Nn(e) ? is(e.__v_raw) : !!(e && e.__v_isReactive);
}
function Nn(e) {
  return !!(e && e.__v_isReadonly);
}
function Vt(e) {
  return !!(e && e.__v_isShallow);
}
function mo(e) {
  return e ? !!e.__v_raw : !1;
}
function He(e) {
  const t = e && e.__v_raw;
  return t ? He(t) : e;
}
function tf(e) {
  return !qe(e, "__v_skip") && Object.isExtensible(e) && Fr(e, "__v_skip", !0), e;
}
const mt = (e) => it(e) ? Vi(e) : e, Ii = (e) => it(e) ? Ol(e) : e;
function vt(e) {
  return e ? e.__v_isRef === !0 : !1;
}
function ie(e) {
  return nf(e, !1);
}
function nf(e, t) {
  return vt(e) ? e : new sf(e, t);
}
class sf {
  constructor(t, n) {
    this.dep = new ho(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : He(t), this._value = n ? t : mt(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || Vt(t) || Nn(t);
    t = s ? t : He(t), In(t, n) && (this._rawValue = t, this._value = s ? t : mt(t), this.dep.trigger());
  }
}
function E(e) {
  return vt(e) ? e.value : e;
}
const rf = {
  get: (e, t, n) => t === "__v_raw" ? e : E(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const i = e[t];
    return vt(i) && !vt(n) ? (i.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function Nl(e) {
  return is(e) ? e : new Proxy(e, rf);
}
class of {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new ho(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Hs - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    nt !== this)
      return bl(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return xl(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
function af(e, t, n = !1) {
  let s, i;
  return _e(e) ? s = e : (s = e.get, i = e.set), new of(s, i, n);
}
const ui = {}, Li = /* @__PURE__ */ new WeakMap();
let qn;
function lf(e, t = !1, n = qn) {
  if (n) {
    let s = Li.get(n);
    s || Li.set(n, s = []), s.push(e);
  }
}
function cf(e, t, n = Qe) {
  const { immediate: s, deep: i, once: r, scheduler: o, augmentJob: a, call: l } = n, d = (T) => i ? T : Vt(T) || i === !1 || i === 0 ? _n(T, 1) : _n(T);
  let c, w, k, D, M = !1, G = !1;
  if (vt(e) ? (w = () => e.value, M = Vt(e)) : is(e) ? (w = () => d(e), M = !0) : pe(e) ? (G = !0, M = e.some((T) => is(T) || Vt(T)), w = () => e.map((T) => {
    if (vt(T))
      return T.value;
    if (is(T))
      return d(T);
    if (_e(T))
      return l ? l(T, 2) : T();
  })) : _e(e) ? t ? w = l ? () => l(e, 2) : e : w = () => {
    if (k) {
      bn();
      try {
        k();
      } finally {
        wn();
      }
    }
    const T = qn;
    qn = c;
    try {
      return l ? l(e, 3, [D]) : e(D);
    } finally {
      qn = T;
    }
  } : w = on, t && i) {
    const T = w, L = i === !0 ? 1 / 0 : i;
    w = () => _n(T(), L);
  }
  const H = Mu(), ce = () => {
    c.stop(), H && H.active && ao(H.effects, c);
  };
  if (r && t) {
    const T = t;
    t = (...L) => {
      T(...L), ce();
    };
  }
  let ue = G ? new Array(e.length).fill(ui) : ui;
  const ge = (T) => {
    if (!(!(c.flags & 1) || !c.dirty && !T))
      if (t) {
        const L = c.run();
        if (i || M || (G ? L.some((V, K) => In(V, ue[K])) : In(L, ue))) {
          k && k();
          const V = qn;
          qn = c;
          try {
            const K = [
              L,
              // pass undefined as the old value when it's changed for the first time
              ue === ui ? void 0 : G && ue[0] === ui ? [] : ue,
              D
            ];
            ue = L, l ? l(t, 3, K) : (
              // @ts-expect-error
              t(...K)
            );
          } finally {
            qn = V;
          }
        }
      } else
        c.run();
  };
  return a && a(ge), c = new yl(w), c.scheduler = o ? () => o(ge, !1) : ge, D = (T) => lf(T, !1, c), k = c.onStop = () => {
    const T = Li.get(c);
    if (T) {
      if (l)
        l(T, 4);
      else
        for (const L of T) L();
      Li.delete(c);
    }
  }, t ? s ? ge(!0) : ue = c.run() : o ? o(ge.bind(null, !0), !0) : c.run(), ce.pause = c.pause.bind(c), ce.resume = c.resume.bind(c), ce.stop = ce, ce;
}
function _n(e, t = 1 / 0, n) {
  if (t <= 0 || !it(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Set(), n.has(e)))
    return e;
  if (n.add(e), t--, vt(e))
    _n(e.value, t, n);
  else if (pe(e))
    for (let s = 0; s < e.length; s++)
      _n(e[s], t, n);
  else if (ul(e) || ss(e))
    e.forEach((s) => {
      _n(s, t, n);
    });
  else if (dl(e)) {
    for (const s in e)
      _n(e[s], t, n);
    for (const s of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, s) && _n(e[s], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function Gs(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (i) {
    Ki(i, t, n);
  }
}
function cn(e, t, n, s) {
  if (_e(e)) {
    const i = Gs(e, t, n, s);
    return i && fl(i) && i.catch((r) => {
      Ki(r, t, n);
    }), i;
  }
  if (pe(e)) {
    const i = [];
    for (let r = 0; r < e.length; r++)
      i.push(cn(e[r], t, n, s));
    return i;
  }
}
function Ki(e, t, n, s = !0) {
  const i = t ? t.vnode : null, { errorHandler: r, throwUnhandledErrorInProduction: o } = t && t.appContext.config || Qe;
  if (t) {
    let a = t.parent;
    const l = t.proxy, d = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; a; ) {
      const c = a.ec;
      if (c) {
        for (let w = 0; w < c.length; w++)
          if (c[w](e, l, d) === !1)
            return;
      }
      a = a.parent;
    }
    if (r) {
      bn(), Gs(r, null, 10, [
        e,
        l,
        d
      ]), wn();
      return;
    }
  }
  uf(e, n, i, s, o);
}
function uf(e, t, n, s = !0, i = !1) {
  if (i)
    throw e;
  console.error(e);
}
const St = [];
let sn = -1;
const rs = [];
let Cn = null, es = 0;
const Pl = /* @__PURE__ */ Promise.resolve();
let Oi = null;
function os(e) {
  const t = Oi || Pl;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function ff(e) {
  let t = sn + 1, n = St.length;
  for (; t < n; ) {
    const s = t + n >>> 1, i = St[s], r = Ws(i);
    r < e || r === e && i.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function _o(e) {
  if (!(e.flags & 1)) {
    const t = Ws(e), n = St[St.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= Ws(n) ? St.push(e) : St.splice(ff(t), 0, e), e.flags |= 1, Ml();
  }
}
function Ml() {
  Oi || (Oi = Pl.then(Dl));
}
function hf(e) {
  pe(e) ? rs.push(...e) : Cn && e.id === -1 ? Cn.splice(es + 1, 0, e) : e.flags & 1 || (rs.push(e), e.flags |= 1), Ml();
}
function ha(e, t, n = sn + 1) {
  for (; n < St.length; n++) {
    const s = St[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid)
        continue;
      St.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function Fl(e) {
  if (rs.length) {
    const t = [...new Set(rs)].sort(
      (n, s) => Ws(n) - Ws(s)
    );
    if (rs.length = 0, Cn) {
      Cn.push(...t);
      return;
    }
    for (Cn = t, es = 0; es < Cn.length; es++) {
      const n = Cn[es];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    Cn = null, es = 0;
  }
}
const Ws = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function Dl(e) {
  try {
    for (sn = 0; sn < St.length; sn++) {
      const t = St[sn];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), Gs(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; sn < St.length; sn++) {
      const t = St[sn];
      t && (t.flags &= -2);
    }
    sn = -1, St.length = 0, Fl(), Oi = null, (St.length || rs.length) && Dl();
  }
}
let jt = null, Bl = null;
function Ni(e) {
  const t = jt;
  return jt = e, Bl = e && e.type.__scopeId || null, t;
}
function df(e, t = jt, n) {
  if (!t || e._n)
    return e;
  const s = (...i) => {
    s._d && wa(-1);
    const r = Ni(t);
    let o;
    try {
      o = e(...i);
    } finally {
      Ni(r), s._d && wa(1);
    }
    return o;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function En(e, t) {
  if (jt === null)
    return e;
  const n = Ji(jt), s = e.dirs || (e.dirs = []);
  for (let i = 0; i < t.length; i++) {
    let [r, o, a, l = Qe] = t[i];
    r && (_e(r) && (r = {
      mounted: r,
      updated: r
    }), r.deep && _n(o), s.push({
      dir: r,
      instance: n,
      value: o,
      oldValue: void 0,
      arg: a,
      modifiers: l
    }));
  }
  return e;
}
function $n(e, t, n, s) {
  const i = e.dirs, r = t && t.dirs;
  for (let o = 0; o < i.length; o++) {
    const a = i[o];
    r && (a.oldValue = r[o].value);
    let l = a.dir[s];
    l && (bn(), cn(l, n, 8, [
      e.el,
      a,
      e,
      t
    ]), wn());
  }
}
const pf = Symbol("_vte"), gf = (e) => e.__isTeleport;
function yo(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, yo(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function $l(e, t) {
  return _e(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    bt({ name: e.name }, t, { setup: e })
  ) : e;
}
function Ul(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function Ds(e, t, n, s, i = !1) {
  if (pe(e)) {
    e.forEach(
      (M, G) => Ds(
        M,
        t && (pe(t) ? t[G] : t),
        n,
        s,
        i
      )
    );
    return;
  }
  if (Bs(s) && !i) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Ds(e, t, n, s.component.subTree);
    return;
  }
  const r = s.shapeFlag & 4 ? Ji(s.component) : s.el, o = i ? null : r, { i: a, r: l } = e, d = t && t.r, c = a.refs === Qe ? a.refs = {} : a.refs, w = a.setupState, k = He(w), D = w === Qe ? () => !1 : (M) => qe(k, M);
  if (d != null && d !== l && (ct(d) ? (c[d] = null, D(d) && (w[d] = null)) : vt(d) && (d.value = null)), _e(l))
    Gs(l, a, 12, [o, c]);
  else {
    const M = ct(l), G = vt(l);
    if (M || G) {
      const H = () => {
        if (e.f) {
          const ce = M ? D(l) ? w[l] : c[l] : l.value;
          i ? pe(ce) && ao(ce, r) : pe(ce) ? ce.includes(r) || ce.push(r) : M ? (c[l] = [r], D(l) && (w[l] = c[l])) : (l.value = [r], e.k && (c[e.k] = l.value));
        } else M ? (c[l] = o, D(l) && (w[l] = o)) : G && (l.value = o, e.k && (c[e.k] = o));
      };
      o ? (H.id = -1, Bt(H, n)) : H();
    }
  }
}
Wi().requestIdleCallback;
Wi().cancelIdleCallback;
const Bs = (e) => !!e.type.__asyncLoader, zl = (e) => e.type.__isKeepAlive;
function mf(e, t) {
  Hl(e, "a", t);
}
function _f(e, t) {
  Hl(e, "da", t);
}
function Hl(e, t, n = Et) {
  const s = e.__wdc || (e.__wdc = () => {
    let i = n;
    for (; i; ) {
      if (i.isDeactivated)
        return;
      i = i.parent;
    }
    return e();
  });
  if (Gi(t, s, n), n) {
    let i = n.parent;
    for (; i && i.parent; )
      zl(i.parent.vnode) && yf(s, t, n, i), i = i.parent;
  }
}
function yf(e, t, n, s) {
  const i = Gi(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  Ys(() => {
    ao(s[t], i);
  }, n);
}
function Gi(e, t, n = Et, s = !1) {
  if (n) {
    const i = n[e] || (n[e] = []), r = t.__weh || (t.__weh = (...o) => {
      bn();
      const a = Xs(n), l = cn(t, n, e, o);
      return a(), wn(), l;
    });
    return s ? i.unshift(r) : i.push(r), r;
  }
}
const kn = (e) => (t, n = Et) => {
  (!Vs || e === "sp") && Gi(e, (...s) => t(...s), n);
}, vf = kn("bm"), Yi = kn("m"), bf = kn(
  "bu"
), wf = kn("u"), ql = kn(
  "bum"
), Ys = kn("um"), kf = kn(
  "sp"
), xf = kn("rtg"), Af = kn("rtc");
function Tf(e, t = Et) {
  Gi("ec", e, t);
}
const Sf = Symbol.for("v-ndc");
function gt(e, t, n, s) {
  let i;
  const r = n, o = pe(e);
  if (o || ct(e)) {
    const a = o && is(e);
    let l = !1, d = !1;
    a && (l = !Vt(e), d = Nn(e), e = ji(e)), i = new Array(e.length);
    for (let c = 0, w = e.length; c < w; c++)
      i[c] = t(
        l ? d ? Ii(mt(e[c])) : mt(e[c]) : e[c],
        c,
        void 0,
        r
      );
  } else if (typeof e == "number") {
    i = new Array(e);
    for (let a = 0; a < e; a++)
      i[a] = t(a + 1, a, void 0, r);
  } else if (it(e))
    if (e[Symbol.iterator])
      i = Array.from(
        e,
        (a, l) => t(a, l, void 0, r)
      );
    else {
      const a = Object.keys(e);
      i = new Array(a.length);
      for (let l = 0, d = a.length; l < d; l++) {
        const c = a[l];
        i[l] = t(e[c], c, l, r);
      }
    }
  else
    i = [];
  return i;
}
const Hr = (e) => e ? fc(e) ? Ji(e) : Hr(e.parent) : null, $s = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ bt(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => Hr(e.parent),
    $root: (e) => Hr(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => jl(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      _o(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = os.bind(e.proxy)),
    $watch: (e) => Gf.bind(e)
  })
), br = (e, t) => e !== Qe && !e.__isScriptSetup && qe(e, t), Ef = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: i, props: r, accessCache: o, type: a, appContext: l } = e;
    let d;
    if (t[0] !== "$") {
      const D = o[t];
      if (D !== void 0)
        switch (D) {
          case 1:
            return s[t];
          case 2:
            return i[t];
          case 4:
            return n[t];
          case 3:
            return r[t];
        }
      else {
        if (br(s, t))
          return o[t] = 1, s[t];
        if (i !== Qe && qe(i, t))
          return o[t] = 2, i[t];
        if (
          // only cache other properties when instance has declared (thus stable)
          // props
          (d = e.propsOptions[0]) && qe(d, t)
        )
          return o[t] = 3, r[t];
        if (n !== Qe && qe(n, t))
          return o[t] = 4, n[t];
        qr && (o[t] = 0);
      }
    }
    const c = $s[t];
    let w, k;
    if (c)
      return t === "$attrs" && yt(e.attrs, "get", ""), c(e);
    if (
      // css module (injected by vue-loader)
      (w = a.__cssModules) && (w = w[t])
    )
      return w;
    if (n !== Qe && qe(n, t))
      return o[t] = 4, n[t];
    if (
      // global properties
      k = l.config.globalProperties, qe(k, t)
    )
      return k[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: i, ctx: r } = e;
    return br(i, t) ? (i[t] = n, !0) : s !== Qe && qe(s, t) ? (s[t] = n, !0) : qe(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (r[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: i, propsOptions: r }
  }, o) {
    let a;
    return !!n[o] || e !== Qe && qe(e, o) || br(t, o) || (a = r[0]) && qe(a, o) || qe(s, o) || qe($s, o) || qe(i.config.globalProperties, o);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : qe(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function da(e) {
  return pe(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let qr = !0;
function Cf(e) {
  const t = jl(e), n = e.proxy, s = e.ctx;
  qr = !1, t.beforeCreate && pa(t.beforeCreate, e, "bc");
  const {
    // state
    data: i,
    computed: r,
    methods: o,
    watch: a,
    provide: l,
    inject: d,
    // lifecycle
    created: c,
    beforeMount: w,
    mounted: k,
    beforeUpdate: D,
    updated: M,
    activated: G,
    deactivated: H,
    beforeDestroy: ce,
    beforeUnmount: ue,
    destroyed: ge,
    unmounted: T,
    render: L,
    renderTracked: V,
    renderTriggered: K,
    errorCaptured: xe,
    serverPrefetch: Pe,
    // public API
    expose: Ke,
    inheritAttrs: Ce,
    // assets
    components: ye,
    directives: Ye,
    filters: et
  } = t;
  if (d && Rf(d, s, null), o)
    for (const de in o) {
      const ae = o[de];
      _e(ae) && (s[de] = ae.bind(n));
    }
  if (i) {
    const de = i.call(n, n);
    it(de) && (e.data = Vi(de));
  }
  if (qr = !0, r)
    for (const de in r) {
      const ae = r[de], Te = _e(ae) ? ae.bind(n, n) : _e(ae.get) ? ae.get.bind(n, n) : on, tt = !_e(ae) && _e(ae.set) ? ae.set.bind(n) : on, oe = le({
        get: Te,
        set: tt
      });
      Object.defineProperty(s, de, {
        enumerable: !0,
        configurable: !0,
        get: () => oe.value,
        set: (Le) => oe.value = Le
      });
    }
  if (a)
    for (const de in a)
      Wl(a[de], s, n, de);
  if (l) {
    const de = _e(l) ? l.call(n) : l;
    Reflect.ownKeys(de).forEach((ae) => {
      Mf(ae, de[ae]);
    });
  }
  c && pa(c, e, "c");
  function fe(de, ae) {
    pe(ae) ? ae.forEach((Te) => de(Te.bind(n))) : ae && de(ae.bind(n));
  }
  if (fe(vf, w), fe(Yi, k), fe(bf, D), fe(wf, M), fe(mf, G), fe(_f, H), fe(Tf, xe), fe(Af, V), fe(xf, K), fe(ql, ue), fe(Ys, T), fe(kf, Pe), pe(Ke))
    if (Ke.length) {
      const de = e.exposed || (e.exposed = {});
      Ke.forEach((ae) => {
        Object.defineProperty(de, ae, {
          get: () => n[ae],
          set: (Te) => n[ae] = Te,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  L && e.render === on && (e.render = L), Ce != null && (e.inheritAttrs = Ce), ye && (e.components = ye), Ye && (e.directives = Ye), Pe && Ul(e);
}
function Rf(e, t, n = on) {
  pe(e) && (e = Wr(e));
  for (const s in e) {
    const i = e[s];
    let r;
    it(i) ? "default" in i ? r = _i(
      i.from || s,
      i.default,
      !0
    ) : r = _i(i.from || s) : r = _i(i), vt(r) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => r.value,
      set: (o) => r.value = o
    }) : t[s] = r;
  }
}
function pa(e, t, n) {
  cn(
    pe(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function Wl(e, t, n, s) {
  let i = s.includes(".") ? ic(n, s) : () => n[s];
  if (ct(e)) {
    const r = t[e];
    _e(r) && Wt(i, r);
  } else if (_e(e))
    Wt(i, e.bind(n));
  else if (it(e))
    if (pe(e))
      e.forEach((r) => Wl(r, t, n, s));
    else {
      const r = _e(e.handler) ? e.handler.bind(n) : t[e.handler];
      _e(r) && Wt(i, r, e);
    }
}
function jl(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: i,
    optionsCache: r,
    config: { optionMergeStrategies: o }
  } = e.appContext, a = r.get(t);
  let l;
  return a ? l = a : !i.length && !n && !s ? l = t : (l = {}, i.length && i.forEach(
    (d) => Pi(l, d, o, !0)
  ), Pi(l, t, o)), it(t) && r.set(t, l), l;
}
function Pi(e, t, n, s = !1) {
  const { mixins: i, extends: r } = t;
  r && Pi(e, r, n, !0), i && i.forEach(
    (o) => Pi(e, o, n, !0)
  );
  for (const o in t)
    if (!(s && o === "expose")) {
      const a = If[o] || n && n[o];
      e[o] = a ? a(e[o], t[o]) : t[o];
    }
  return e;
}
const If = {
  data: ga,
  props: ma,
  emits: ma,
  // objects
  methods: Ls,
  computed: Ls,
  // lifecycle
  beforeCreate: Tt,
  created: Tt,
  beforeMount: Tt,
  mounted: Tt,
  beforeUpdate: Tt,
  updated: Tt,
  beforeDestroy: Tt,
  beforeUnmount: Tt,
  destroyed: Tt,
  unmounted: Tt,
  activated: Tt,
  deactivated: Tt,
  errorCaptured: Tt,
  serverPrefetch: Tt,
  // assets
  components: Ls,
  directives: Ls,
  // watch
  watch: Of,
  // provide / inject
  provide: ga,
  inject: Lf
};
function ga(e, t) {
  return t ? e ? function() {
    return bt(
      _e(e) ? e.call(this, this) : e,
      _e(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function Lf(e, t) {
  return Ls(Wr(e), Wr(t));
}
function Wr(e) {
  if (pe(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function Tt(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function Ls(e, t) {
  return e ? bt(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function ma(e, t) {
  return e ? pe(e) && pe(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : bt(
    /* @__PURE__ */ Object.create(null),
    da(e),
    da(t ?? {})
  ) : t;
}
function Of(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = bt(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = Tt(e[s], t[s]);
  return n;
}
function Vl() {
  return {
    app: null,
    config: {
      isNativeTag: xu,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let Nf = 0;
function Pf(e, t) {
  return function(s, i = null) {
    _e(s) || (s = bt({}, s)), i != null && !it(i) && (i = null);
    const r = Vl(), o = /* @__PURE__ */ new WeakSet(), a = [];
    let l = !1;
    const d = r.app = {
      _uid: Nf++,
      _component: s,
      _props: i,
      _container: null,
      _context: r,
      _instance: null,
      version: gh,
      get config() {
        return r.config;
      },
      set config(c) {
      },
      use(c, ...w) {
        return o.has(c) || (c && _e(c.install) ? (o.add(c), c.install(d, ...w)) : _e(c) && (o.add(c), c(d, ...w))), d;
      },
      mixin(c) {
        return r.mixins.includes(c) || r.mixins.push(c), d;
      },
      component(c, w) {
        return w ? (r.components[c] = w, d) : r.components[c];
      },
      directive(c, w) {
        return w ? (r.directives[c] = w, d) : r.directives[c];
      },
      mount(c, w, k) {
        if (!l) {
          const D = d._ceVNode || an(s, i);
          return D.appContext = r, k === !0 ? k = "svg" : k === !1 && (k = void 0), e(D, c, k), l = !0, d._container = c, c.__vue_app__ = d, Ji(D.component);
        }
      },
      onUnmount(c) {
        a.push(c);
      },
      unmount() {
        l && (cn(
          a,
          d._instance,
          16
        ), e(null, d._container), delete d._container.__vue_app__);
      },
      provide(c, w) {
        return r.provides[c] = w, d;
      },
      runWithContext(c) {
        const w = as;
        as = d;
        try {
          return c();
        } finally {
          as = w;
        }
      }
    };
    return d;
  };
}
let as = null;
function Mf(e, t) {
  if (Et) {
    let n = Et.provides;
    const s = Et.parent && Et.parent.provides;
    s === n && (n = Et.provides = Object.create(s)), n[e] = t;
  }
}
function _i(e, t, n = !1) {
  const s = ch();
  if (s || as) {
    let i = as ? as._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (i && e in i)
      return i[e];
    if (arguments.length > 1)
      return n && _e(t) ? t.call(s && s.proxy) : t;
  }
}
const Kl = {}, Gl = () => Object.create(Kl), Yl = (e) => Object.getPrototypeOf(e) === Kl;
function Ff(e, t, n, s = !1) {
  const i = {}, r = Gl();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Xl(e, t, i, r);
  for (const o in e.propsOptions[0])
    o in i || (i[o] = void 0);
  n ? e.props = s ? i : ef(i) : e.type.props ? e.props = i : e.props = r, e.attrs = r;
}
function Df(e, t, n, s) {
  const {
    props: i,
    attrs: r,
    vnode: { patchFlag: o }
  } = e, a = He(i), [l] = e.propsOptions;
  let d = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (s || o > 0) && !(o & 16)
  ) {
    if (o & 8) {
      const c = e.vnode.dynamicProps;
      for (let w = 0; w < c.length; w++) {
        let k = c[w];
        if (Xi(e.emitsOptions, k))
          continue;
        const D = t[k];
        if (l)
          if (qe(r, k))
            D !== r[k] && (r[k] = D, d = !0);
          else {
            const M = On(k);
            i[M] = jr(
              l,
              a,
              M,
              D,
              e,
              !1
            );
          }
        else
          D !== r[k] && (r[k] = D, d = !0);
      }
    }
  } else {
    Xl(e, t, i, r) && (d = !0);
    let c;
    for (const w in a)
      (!t || // for camelCase
      !qe(t, w) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((c = Fn(w)) === w || !qe(t, c))) && (l ? n && // for camelCase
      (n[w] !== void 0 || // for kebab-case
      n[c] !== void 0) && (i[w] = jr(
        l,
        a,
        w,
        void 0,
        e,
        !0
      )) : delete i[w]);
    if (r !== a)
      for (const w in r)
        (!t || !qe(t, w)) && (delete r[w], d = !0);
  }
  d && mn(e.attrs, "set", "");
}
function Xl(e, t, n, s) {
  const [i, r] = e.propsOptions;
  let o = !1, a;
  if (t)
    for (let l in t) {
      if (Ps(l))
        continue;
      const d = t[l];
      let c;
      i && qe(i, c = On(l)) ? !r || !r.includes(c) ? n[c] = d : (a || (a = {}))[c] = d : Xi(e.emitsOptions, l) || (!(l in s) || d !== s[l]) && (s[l] = d, o = !0);
    }
  if (r) {
    const l = He(n), d = a || Qe;
    for (let c = 0; c < r.length; c++) {
      const w = r[c];
      n[w] = jr(
        i,
        l,
        w,
        d[w],
        e,
        !qe(d, w)
      );
    }
  }
  return o;
}
function jr(e, t, n, s, i, r) {
  const o = e[n];
  if (o != null) {
    const a = qe(o, "default");
    if (a && s === void 0) {
      const l = o.default;
      if (o.type !== Function && !o.skipFactory && _e(l)) {
        const { propsDefaults: d } = i;
        if (n in d)
          s = d[n];
        else {
          const c = Xs(i);
          s = d[n] = l.call(
            null,
            t
          ), c();
        }
      } else
        s = l;
      i.ce && i.ce._setProp(n, s);
    }
    o[
      0
      /* shouldCast */
    ] && (r && !a ? s = !1 : o[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === Fn(n)) && (s = !0));
  }
  return s;
}
const Bf = /* @__PURE__ */ new WeakMap();
function Zl(e, t, n = !1) {
  const s = n ? Bf : t.propsCache, i = s.get(e);
  if (i)
    return i;
  const r = e.props, o = {}, a = [];
  let l = !1;
  if (!_e(e)) {
    const c = (w) => {
      l = !0;
      const [k, D] = Zl(w, t, !0);
      bt(o, k), D && a.push(...D);
    };
    !n && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  if (!r && !l)
    return it(e) && s.set(e, ns), ns;
  if (pe(r))
    for (let c = 0; c < r.length; c++) {
      const w = On(r[c]);
      _a(w) && (o[w] = Qe);
    }
  else if (r)
    for (const c in r) {
      const w = On(c);
      if (_a(w)) {
        const k = r[c], D = o[w] = pe(k) || _e(k) ? { type: k } : bt({}, k), M = D.type;
        let G = !1, H = !0;
        if (pe(M))
          for (let ce = 0; ce < M.length; ++ce) {
            const ue = M[ce], ge = _e(ue) && ue.name;
            if (ge === "Boolean") {
              G = !0;
              break;
            } else ge === "String" && (H = !1);
          }
        else
          G = _e(M) && M.name === "Boolean";
        D[
          0
          /* shouldCast */
        ] = G, D[
          1
          /* shouldCastTrue */
        ] = H, (G || qe(D, "default")) && a.push(w);
      }
    }
  const d = [o, a];
  return it(e) && s.set(e, d), d;
}
function _a(e) {
  return e[0] !== "$" && !Ps(e);
}
const vo = (e) => e === "_" || e === "__" || e === "_ctx" || e === "$stable", bo = (e) => pe(e) ? e.map(rn) : [rn(e)], $f = (e, t, n) => {
  if (t._n)
    return t;
  const s = df((...i) => bo(t(...i)), n);
  return s._c = !1, s;
}, Jl = (e, t, n) => {
  const s = e._ctx;
  for (const i in e) {
    if (vo(i)) continue;
    const r = e[i];
    if (_e(r))
      t[i] = $f(i, r, s);
    else if (r != null) {
      const o = bo(r);
      t[i] = () => o;
    }
  }
}, Ql = (e, t) => {
  const n = bo(t);
  e.slots.default = () => n;
}, ec = (e, t, n) => {
  for (const s in t)
    (n || !vo(s)) && (e[s] = t[s]);
}, Uf = (e, t, n) => {
  const s = e.slots = Gl();
  if (e.vnode.shapeFlag & 32) {
    const i = t.__;
    i && Fr(s, "__", i, !0);
    const r = t._;
    r ? (ec(s, t, n), n && Fr(s, "_", r, !0)) : Jl(t, s);
  } else t && Ql(e, t);
}, zf = (e, t, n) => {
  const { vnode: s, slots: i } = e;
  let r = !0, o = Qe;
  if (s.shapeFlag & 32) {
    const a = t._;
    a ? n && a === 1 ? r = !1 : ec(i, t, n) : (r = !t.$stable, Jl(t, i)), o = t;
  } else t && (Ql(e, t), o = { default: 1 });
  if (r)
    for (const a in i)
      !vo(a) && o[a] == null && delete i[a];
}, Bt = th;
function Hf(e) {
  return qf(e);
}
function qf(e, t) {
  const n = Wi();
  n.__VUE__ = !0;
  const {
    insert: s,
    remove: i,
    patchProp: r,
    createElement: o,
    createText: a,
    createComment: l,
    setText: d,
    setElementText: c,
    parentNode: w,
    nextSibling: k,
    setScopeId: D = on,
    insertStaticContent: M
  } = e, G = (p, m, v, N = null, R = null, I = null, U = void 0, z = null, B = !!m.dynamicChildren) => {
    if (p === m)
      return;
    p && !vs(p, m) && (N = ut(p), Le(p, R, I, !0), p = null), m.patchFlag === -2 && (B = !1, m.dynamicChildren = null);
    const { type: F, ref: J, shapeFlag: q } = m;
    switch (F) {
      case Zi:
        H(p, m, v, N);
        break;
      case Pn:
        ce(p, m, v, N);
        break;
      case yi:
        p == null && ue(m, v, N, U);
        break;
      case De:
        ye(
          p,
          m,
          v,
          N,
          R,
          I,
          U,
          z,
          B
        );
        break;
      default:
        q & 1 ? L(
          p,
          m,
          v,
          N,
          R,
          I,
          U,
          z,
          B
        ) : q & 6 ? Ye(
          p,
          m,
          v,
          N,
          R,
          I,
          U,
          z,
          B
        ) : (q & 64 || q & 128) && F.process(
          p,
          m,
          v,
          N,
          R,
          I,
          U,
          z,
          B,
          W
        );
    }
    J != null && R ? Ds(J, p && p.ref, I, m || p, !m) : J == null && p && p.ref != null && Ds(p.ref, null, I, p, !0);
  }, H = (p, m, v, N) => {
    if (p == null)
      s(
        m.el = a(m.children),
        v,
        N
      );
    else {
      const R = m.el = p.el;
      m.children !== p.children && d(R, m.children);
    }
  }, ce = (p, m, v, N) => {
    p == null ? s(
      m.el = l(m.children || ""),
      v,
      N
    ) : m.el = p.el;
  }, ue = (p, m, v, N) => {
    [p.el, p.anchor] = M(
      p.children,
      m,
      v,
      N,
      p.el,
      p.anchor
    );
  }, ge = ({ el: p, anchor: m }, v, N) => {
    let R;
    for (; p && p !== m; )
      R = k(p), s(p, v, N), p = R;
    s(m, v, N);
  }, T = ({ el: p, anchor: m }) => {
    let v;
    for (; p && p !== m; )
      v = k(p), i(p), p = v;
    i(m);
  }, L = (p, m, v, N, R, I, U, z, B) => {
    m.type === "svg" ? U = "svg" : m.type === "math" && (U = "mathml"), p == null ? V(
      m,
      v,
      N,
      R,
      I,
      U,
      z,
      B
    ) : Pe(
      p,
      m,
      R,
      I,
      U,
      z,
      B
    );
  }, V = (p, m, v, N, R, I, U, z) => {
    let B, F;
    const { props: J, shapeFlag: q, transition: Z, dirs: te } = p;
    if (B = p.el = o(
      p.type,
      I,
      J && J.is,
      J
    ), q & 8 ? c(B, p.children) : q & 16 && xe(
      p.children,
      B,
      null,
      N,
      R,
      wr(p, I),
      U,
      z
    ), te && $n(p, null, N, "created"), K(B, p, p.scopeId, U, N), J) {
      for (const me in J)
        me !== "value" && !Ps(me) && r(B, me, null, J[me], I, N);
      "value" in J && r(B, "value", null, J.value, I), (F = J.onVnodeBeforeMount) && tn(F, N, p);
    }
    te && $n(p, null, N, "beforeMount");
    const re = Wf(R, Z);
    re && Z.beforeEnter(B), s(B, m, v), ((F = J && J.onVnodeMounted) || re || te) && Bt(() => {
      F && tn(F, N, p), re && Z.enter(B), te && $n(p, null, N, "mounted");
    }, R);
  }, K = (p, m, v, N, R) => {
    if (v && D(p, v), N)
      for (let I = 0; I < N.length; I++)
        D(p, N[I]);
    if (R) {
      let I = R.subTree;
      if (m === I || oc(I.type) && (I.ssContent === m || I.ssFallback === m)) {
        const U = R.vnode;
        K(
          p,
          U,
          U.scopeId,
          U.slotScopeIds,
          R.parent
        );
      }
    }
  }, xe = (p, m, v, N, R, I, U, z, B = 0) => {
    for (let F = B; F < p.length; F++) {
      const J = p[F] = z ? Rn(p[F]) : rn(p[F]);
      G(
        null,
        J,
        m,
        v,
        N,
        R,
        I,
        U,
        z
      );
    }
  }, Pe = (p, m, v, N, R, I, U) => {
    const z = m.el = p.el;
    let { patchFlag: B, dynamicChildren: F, dirs: J } = m;
    B |= p.patchFlag & 16;
    const q = p.props || Qe, Z = m.props || Qe;
    let te;
    if (v && Un(v, !1), (te = Z.onVnodeBeforeUpdate) && tn(te, v, m, p), J && $n(m, p, v, "beforeUpdate"), v && Un(v, !0), (q.innerHTML && Z.innerHTML == null || q.textContent && Z.textContent == null) && c(z, ""), F ? Ke(
      p.dynamicChildren,
      F,
      z,
      v,
      N,
      wr(m, R),
      I
    ) : U || ae(
      p,
      m,
      z,
      null,
      v,
      N,
      wr(m, R),
      I,
      !1
    ), B > 0) {
      if (B & 16)
        Ce(z, q, Z, v, R);
      else if (B & 2 && q.class !== Z.class && r(z, "class", null, Z.class, R), B & 4 && r(z, "style", q.style, Z.style, R), B & 8) {
        const re = m.dynamicProps;
        for (let me = 0; me < re.length; me++) {
          const Ae = re[me], Ne = q[Ae], je = Z[Ae];
          (je !== Ne || Ae === "value") && r(z, Ae, Ne, je, R, v);
        }
      }
      B & 1 && p.children !== m.children && c(z, m.children);
    } else !U && F == null && Ce(z, q, Z, v, R);
    ((te = Z.onVnodeUpdated) || J) && Bt(() => {
      te && tn(te, v, m, p), J && $n(m, p, v, "updated");
    }, N);
  }, Ke = (p, m, v, N, R, I, U) => {
    for (let z = 0; z < m.length; z++) {
      const B = p[z], F = m[z], J = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        B.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (B.type === De || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !vs(B, F) || // - In the case of a component, it could contain anything.
        B.shapeFlag & 198) ? w(B.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          v
        )
      );
      G(
        B,
        F,
        J,
        null,
        N,
        R,
        I,
        U,
        !0
      );
    }
  }, Ce = (p, m, v, N, R) => {
    if (m !== v) {
      if (m !== Qe)
        for (const I in m)
          !Ps(I) && !(I in v) && r(
            p,
            I,
            m[I],
            null,
            R,
            N
          );
      for (const I in v) {
        if (Ps(I)) continue;
        const U = v[I], z = m[I];
        U !== z && I !== "value" && r(p, I, z, U, R, N);
      }
      "value" in v && r(p, "value", m.value, v.value, R);
    }
  }, ye = (p, m, v, N, R, I, U, z, B) => {
    const F = m.el = p ? p.el : a(""), J = m.anchor = p ? p.anchor : a("");
    let { patchFlag: q, dynamicChildren: Z, slotScopeIds: te } = m;
    te && (z = z ? z.concat(te) : te), p == null ? (s(F, v, N), s(J, v, N), xe(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      m.children || [],
      v,
      J,
      R,
      I,
      U,
      z,
      B
    )) : q > 0 && q & 64 && Z && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    p.dynamicChildren ? (Ke(
      p.dynamicChildren,
      Z,
      v,
      R,
      I,
      U,
      z
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (m.key != null || R && m === R.subTree) && tc(
      p,
      m,
      !0
      /* shallow */
    )) : ae(
      p,
      m,
      v,
      J,
      R,
      I,
      U,
      z,
      B
    );
  }, Ye = (p, m, v, N, R, I, U, z, B) => {
    m.slotScopeIds = z, p == null ? m.shapeFlag & 512 ? R.ctx.activate(
      m,
      v,
      N,
      U,
      B
    ) : et(
      m,
      v,
      N,
      R,
      I,
      U,
      B
    ) : rt(p, m, B);
  }, et = (p, m, v, N, R, I, U) => {
    const z = p.component = lh(
      p,
      N,
      R
    );
    if (zl(p) && (z.ctx.renderer = W), uh(z, !1, U), z.asyncDep) {
      if (R && R.registerDep(z, fe, U), !p.el) {
        const B = z.subTree = an(Pn);
        ce(null, B, m, v), p.placeholder = B.el;
      }
    } else
      fe(
        z,
        p,
        m,
        v,
        R,
        I,
        U
      );
  }, rt = (p, m, v) => {
    const N = m.component = p.component;
    if (Qf(p, m, v))
      if (N.asyncDep && !N.asyncResolved) {
        de(N, m, v);
        return;
      } else
        N.next = m, N.update();
    else
      m.el = p.el, N.vnode = m;
  }, fe = (p, m, v, N, R, I, U) => {
    const z = () => {
      if (p.isMounted) {
        let { next: q, bu: Z, u: te, parent: re, vnode: me } = p;
        {
          const f = nc(p);
          if (f) {
            q && (q.el = me.el, de(p, q, U)), f.asyncDep.then(() => {
              p.isUnmounted || z();
            });
            return;
          }
        }
        let Ae = q, Ne;
        Un(p, !1), q ? (q.el = me.el, de(p, q, U)) : q = me, Z && mi(Z), (Ne = q.props && q.props.onVnodeBeforeUpdate) && tn(Ne, re, q, me), Un(p, !0);
        const je = va(p), ft = p.subTree;
        p.subTree = je, G(
          ft,
          je,
          // parent may have changed if it's in a teleport
          w(ft.el),
          // anchor may have changed if it's in a fragment
          ut(ft),
          p,
          R,
          I
        ), q.el = je.el, Ae === null && eh(p, je.el), te && Bt(te, R), (Ne = q.props && q.props.onVnodeUpdated) && Bt(
          () => tn(Ne, re, q, me),
          R
        );
      } else {
        let q;
        const { el: Z, props: te } = m, { bm: re, m: me, parent: Ae, root: Ne, type: je } = p, ft = Bs(m);
        Un(p, !1), re && mi(re), !ft && (q = te && te.onVnodeBeforeMount) && tn(q, Ae, m), Un(p, !0);
        {
          Ne.ce && // @ts-expect-error _def is private
          Ne.ce._def.shadowRoot !== !1 && Ne.ce._injectChildStyle(je);
          const f = p.subTree = va(p);
          G(
            null,
            f,
            v,
            N,
            p,
            R,
            I
          ), m.el = f.el;
        }
        if (me && Bt(me, R), !ft && (q = te && te.onVnodeMounted)) {
          const f = m;
          Bt(
            () => tn(q, Ae, f),
            R
          );
        }
        (m.shapeFlag & 256 || Ae && Bs(Ae.vnode) && Ae.vnode.shapeFlag & 256) && p.a && Bt(p.a, R), p.isMounted = !0, m = v = N = null;
      }
    };
    p.scope.on();
    const B = p.effect = new yl(z);
    p.scope.off();
    const F = p.update = B.run.bind(B), J = p.job = B.runIfDirty.bind(B);
    J.i = p, J.id = p.uid, B.scheduler = () => _o(J), Un(p, !0), F();
  }, de = (p, m, v) => {
    m.component = p;
    const N = p.vnode.props;
    p.vnode = m, p.next = null, Df(p, m.props, N, v), zf(p, m.children, v), bn(), ha(p), wn();
  }, ae = (p, m, v, N, R, I, U, z, B = !1) => {
    const F = p && p.children, J = p ? p.shapeFlag : 0, q = m.children, { patchFlag: Z, shapeFlag: te } = m;
    if (Z > 0) {
      if (Z & 128) {
        tt(
          F,
          q,
          v,
          N,
          R,
          I,
          U,
          z,
          B
        );
        return;
      } else if (Z & 256) {
        Te(
          F,
          q,
          v,
          N,
          R,
          I,
          U,
          z,
          B
        );
        return;
      }
    }
    te & 8 ? (J & 16 && ot(F, R, I), q !== F && c(v, q)) : J & 16 ? te & 16 ? tt(
      F,
      q,
      v,
      N,
      R,
      I,
      U,
      z,
      B
    ) : ot(F, R, I, !0) : (J & 8 && c(v, ""), te & 16 && xe(
      q,
      v,
      N,
      R,
      I,
      U,
      z,
      B
    ));
  }, Te = (p, m, v, N, R, I, U, z, B) => {
    p = p || ns, m = m || ns;
    const F = p.length, J = m.length, q = Math.min(F, J);
    let Z;
    for (Z = 0; Z < q; Z++) {
      const te = m[Z] = B ? Rn(m[Z]) : rn(m[Z]);
      G(
        p[Z],
        te,
        v,
        null,
        R,
        I,
        U,
        z,
        B
      );
    }
    F > J ? ot(
      p,
      R,
      I,
      !0,
      !1,
      q
    ) : xe(
      m,
      v,
      N,
      R,
      I,
      U,
      z,
      B,
      q
    );
  }, tt = (p, m, v, N, R, I, U, z, B) => {
    let F = 0;
    const J = m.length;
    let q = p.length - 1, Z = J - 1;
    for (; F <= q && F <= Z; ) {
      const te = p[F], re = m[F] = B ? Rn(m[F]) : rn(m[F]);
      if (vs(te, re))
        G(
          te,
          re,
          v,
          null,
          R,
          I,
          U,
          z,
          B
        );
      else
        break;
      F++;
    }
    for (; F <= q && F <= Z; ) {
      const te = p[q], re = m[Z] = B ? Rn(m[Z]) : rn(m[Z]);
      if (vs(te, re))
        G(
          te,
          re,
          v,
          null,
          R,
          I,
          U,
          z,
          B
        );
      else
        break;
      q--, Z--;
    }
    if (F > q) {
      if (F <= Z) {
        const te = Z + 1, re = te < J ? m[te].el : N;
        for (; F <= Z; )
          G(
            null,
            m[F] = B ? Rn(m[F]) : rn(m[F]),
            v,
            re,
            R,
            I,
            U,
            z,
            B
          ), F++;
      }
    } else if (F > Z)
      for (; F <= q; )
        Le(p[F], R, I, !0), F++;
    else {
      const te = F, re = F, me = /* @__PURE__ */ new Map();
      for (F = re; F <= Z; F++) {
        const S = m[F] = B ? Rn(m[F]) : rn(m[F]);
        S.key != null && me.set(S.key, F);
      }
      let Ae, Ne = 0;
      const je = Z - re + 1;
      let ft = !1, f = 0;
      const y = new Array(je);
      for (F = 0; F < je; F++) y[F] = 0;
      for (F = te; F <= q; F++) {
        const S = p[F];
        if (Ne >= je) {
          Le(S, R, I, !0);
          continue;
        }
        let $;
        if (S.key != null)
          $ = me.get(S.key);
        else
          for (Ae = re; Ae <= Z; Ae++)
            if (y[Ae - re] === 0 && vs(S, m[Ae])) {
              $ = Ae;
              break;
            }
        $ === void 0 ? Le(S, R, I, !0) : (y[$ - re] = F + 1, $ >= f ? f = $ : ft = !0, G(
          S,
          m[$],
          v,
          null,
          R,
          I,
          U,
          z,
          B
        ), Ne++);
      }
      const C = ft ? jf(y) : ns;
      for (Ae = C.length - 1, F = je - 1; F >= 0; F--) {
        const S = re + F, $ = m[S], Y = m[S + 1], ne = S + 1 < J ? (
          // #13559, fallback to el placeholder for unresolved async component
          Y.el || Y.placeholder
        ) : N;
        y[F] === 0 ? G(
          null,
          $,
          v,
          ne,
          R,
          I,
          U,
          z,
          B
        ) : ft && (Ae < 0 || F !== C[Ae] ? oe($, v, ne, 2) : Ae--);
      }
    }
  }, oe = (p, m, v, N, R = null) => {
    const { el: I, type: U, transition: z, children: B, shapeFlag: F } = p;
    if (F & 6) {
      oe(p.component.subTree, m, v, N);
      return;
    }
    if (F & 128) {
      p.suspense.move(m, v, N);
      return;
    }
    if (F & 64) {
      U.move(p, m, v, W);
      return;
    }
    if (U === De) {
      s(I, m, v);
      for (let q = 0; q < B.length; q++)
        oe(B[q], m, v, N);
      s(p.anchor, m, v);
      return;
    }
    if (U === yi) {
      ge(p, m, v);
      return;
    }
    if (N !== 2 && F & 1 && z)
      if (N === 0)
        z.beforeEnter(I), s(I, m, v), Bt(() => z.enter(I), R);
      else {
        const { leave: q, delayLeave: Z, afterLeave: te } = z, re = () => {
          p.ctx.isUnmounted ? i(I) : s(I, m, v);
        }, me = () => {
          q(I, () => {
            re(), te && te();
          });
        };
        Z ? Z(I, re, me) : me();
      }
    else
      s(I, m, v);
  }, Le = (p, m, v, N = !1, R = !1) => {
    const {
      type: I,
      props: U,
      ref: z,
      children: B,
      dynamicChildren: F,
      shapeFlag: J,
      patchFlag: q,
      dirs: Z,
      cacheIndex: te
    } = p;
    if (q === -2 && (R = !1), z != null && (bn(), Ds(z, null, v, p, !0), wn()), te != null && (m.renderCache[te] = void 0), J & 256) {
      m.ctx.deactivate(p);
      return;
    }
    const re = J & 1 && Z, me = !Bs(p);
    let Ae;
    if (me && (Ae = U && U.onVnodeBeforeUnmount) && tn(Ae, m, p), J & 6)
      Re(p.component, v, N);
    else {
      if (J & 128) {
        p.suspense.unmount(v, N);
        return;
      }
      re && $n(p, null, m, "beforeUnmount"), J & 64 ? p.type.remove(
        p,
        m,
        v,
        W,
        N
      ) : F && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !F.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (I !== De || q > 0 && q & 64) ? ot(
        F,
        m,
        v,
        !1,
        !0
      ) : (I === De && q & 384 || !R && J & 16) && ot(B, m, v), N && Oe(p);
    }
    (me && (Ae = U && U.onVnodeUnmounted) || re) && Bt(() => {
      Ae && tn(Ae, m, p), re && $n(p, null, m, "unmounted");
    }, v);
  }, Oe = (p) => {
    const { type: m, el: v, anchor: N, transition: R } = p;
    if (m === De) {
      pt(v, N);
      return;
    }
    if (m === yi) {
      T(p);
      return;
    }
    const I = () => {
      i(v), R && !R.persisted && R.afterLeave && R.afterLeave();
    };
    if (p.shapeFlag & 1 && R && !R.persisted) {
      const { leave: U, delayLeave: z } = R, B = () => U(v, I);
      z ? z(p.el, I, B) : B();
    } else
      I();
  }, pt = (p, m) => {
    let v;
    for (; p !== m; )
      v = k(p), i(p), p = v;
    i(m);
  }, Re = (p, m, v) => {
    const {
      bum: N,
      scope: R,
      job: I,
      subTree: U,
      um: z,
      m: B,
      a: F,
      parent: J,
      slots: { __: q }
    } = p;
    ya(B), ya(F), N && mi(N), J && pe(q) && q.forEach((Z) => {
      J.renderCache[Z] = void 0;
    }), R.stop(), I && (I.flags |= 8, Le(U, p, m, v)), z && Bt(z, m), Bt(() => {
      p.isUnmounted = !0;
    }, m), m && m.pendingBranch && !m.isUnmounted && p.asyncDep && !p.asyncResolved && p.suspenseId === m.pendingId && (m.deps--, m.deps === 0 && m.resolve());
  }, ot = (p, m, v, N = !1, R = !1, I = 0) => {
    for (let U = I; U < p.length; U++)
      Le(p[U], m, v, N, R);
  }, ut = (p) => {
    if (p.shapeFlag & 6)
      return ut(p.component.subTree);
    if (p.shapeFlag & 128)
      return p.suspense.next();
    const m = k(p.anchor || p.el), v = m && m[pf];
    return v ? k(v) : m;
  };
  let Lt = !1;
  const _t = (p, m, v) => {
    p == null ? m._vnode && Le(m._vnode, null, null, !0) : G(
      m._vnode || null,
      p,
      m,
      null,
      null,
      null,
      v
    ), m._vnode = p, Lt || (Lt = !0, ha(), Fl(), Lt = !1);
  }, W = {
    p: G,
    um: Le,
    m: oe,
    r: Oe,
    mt: et,
    mc: xe,
    pc: ae,
    pbc: Ke,
    n: ut,
    o: e
  };
  return {
    render: _t,
    hydrate: void 0,
    createApp: Pf(_t)
  };
}
function wr({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function Un({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Wf(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function tc(e, t, n = !1) {
  const s = e.children, i = t.children;
  if (pe(s) && pe(i))
    for (let r = 0; r < s.length; r++) {
      const o = s[r];
      let a = i[r];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[r] = Rn(i[r]), a.el = o.el), !n && a.patchFlag !== -2 && tc(o, a)), a.type === Zi && (a.el = o.el), a.type === Pn && !a.el && (a.el = o.el);
    }
}
function jf(e) {
  const t = e.slice(), n = [0];
  let s, i, r, o, a;
  const l = e.length;
  for (s = 0; s < l; s++) {
    const d = e[s];
    if (d !== 0) {
      if (i = n[n.length - 1], e[i] < d) {
        t[s] = i, n.push(s);
        continue;
      }
      for (r = 0, o = n.length - 1; r < o; )
        a = r + o >> 1, e[n[a]] < d ? r = a + 1 : o = a;
      d < e[n[r]] && (r > 0 && (t[s] = n[r - 1]), n[r] = s);
    }
  }
  for (r = n.length, o = n[r - 1]; r-- > 0; )
    n[r] = o, o = t[o];
  return n;
}
function nc(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : nc(t);
}
function ya(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
const Vf = Symbol.for("v-scx"), Kf = () => _i(Vf);
function Wt(e, t, n) {
  return sc(e, t, n);
}
function sc(e, t, n = Qe) {
  const { immediate: s, deep: i, flush: r, once: o } = n, a = bt({}, n), l = t && s || !t && r !== "post";
  let d;
  if (Vs) {
    if (r === "sync") {
      const D = Kf();
      d = D.__watcherHandles || (D.__watcherHandles = []);
    } else if (!l) {
      const D = () => {
      };
      return D.stop = on, D.resume = on, D.pause = on, D;
    }
  }
  const c = Et;
  a.call = (D, M, G) => cn(D, c, M, G);
  let w = !1;
  r === "post" ? a.scheduler = (D) => {
    Bt(D, c && c.suspense);
  } : r !== "sync" && (w = !0, a.scheduler = (D, M) => {
    M ? D() : _o(D);
  }), a.augmentJob = (D) => {
    t && (D.flags |= 4), w && (D.flags |= 2, c && (D.id = c.uid, D.i = c));
  };
  const k = cf(e, t, a);
  return Vs && (d ? d.push(k) : l && k()), k;
}
function Gf(e, t, n) {
  const s = this.proxy, i = ct(e) ? e.includes(".") ? ic(s, e) : () => s[e] : e.bind(s, s);
  let r;
  _e(t) ? r = t : (r = t.handler, n = t);
  const o = Xs(this), a = sc(i, r.bind(s), n);
  return o(), a;
}
function ic(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let i = 0; i < n.length && s; i++)
      s = s[n[i]];
    return s;
  };
}
const Yf = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${On(t)}Modifiers`] || e[`${Fn(t)}Modifiers`];
function Xf(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || Qe;
  let i = n;
  const r = t.startsWith("update:"), o = r && Yf(s, t.slice(7));
  o && (o.trim && (i = n.map((c) => ct(c) ? c.trim() : c)), o.number && (i = n.map(Dr)));
  let a, l = s[a = gr(t)] || // also try camelCase event handler (#2249)
  s[a = gr(On(t))];
  !l && r && (l = s[a = gr(Fn(t))]), l && cn(
    l,
    e,
    6,
    i
  );
  const d = s[a + "Once"];
  if (d) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[a])
      return;
    e.emitted[a] = !0, cn(
      d,
      e,
      6,
      i
    );
  }
}
function rc(e, t, n = !1) {
  const s = t.emitsCache, i = s.get(e);
  if (i !== void 0)
    return i;
  const r = e.emits;
  let o = {}, a = !1;
  if (!_e(e)) {
    const l = (d) => {
      const c = rc(d, t, !0);
      c && (a = !0, bt(o, c));
    };
    !n && t.mixins.length && t.mixins.forEach(l), e.extends && l(e.extends), e.mixins && e.mixins.forEach(l);
  }
  return !r && !a ? (it(e) && s.set(e, null), null) : (pe(r) ? r.forEach((l) => o[l] = null) : bt(o, r), it(e) && s.set(e, o), o);
}
function Xi(e, t) {
  return !e || !zi(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), qe(e, t[0].toLowerCase() + t.slice(1)) || qe(e, Fn(t)) || qe(e, t));
}
function va(e) {
  const {
    type: t,
    vnode: n,
    proxy: s,
    withProxy: i,
    propsOptions: [r],
    slots: o,
    attrs: a,
    emit: l,
    render: d,
    renderCache: c,
    props: w,
    data: k,
    setupState: D,
    ctx: M,
    inheritAttrs: G
  } = e, H = Ni(e);
  let ce, ue;
  try {
    if (n.shapeFlag & 4) {
      const T = i || s, L = T;
      ce = rn(
        d.call(
          L,
          T,
          c,
          w,
          D,
          k,
          M
        )
      ), ue = a;
    } else {
      const T = t;
      ce = rn(
        T.length > 1 ? T(
          w,
          { attrs: a, slots: o, emit: l }
        ) : T(
          w,
          null
        )
      ), ue = t.props ? a : Zf(a);
    }
  } catch (T) {
    Us.length = 0, Ki(T, e, 1), ce = an(Pn);
  }
  let ge = ce;
  if (ue && G !== !1) {
    const T = Object.keys(ue), { shapeFlag: L } = ge;
    T.length && L & 7 && (r && T.some(oo) && (ue = Jf(
      ue,
      r
    )), ge = cs(ge, ue, !1, !0));
  }
  return n.dirs && (ge = cs(ge, null, !1, !0), ge.dirs = ge.dirs ? ge.dirs.concat(n.dirs) : n.dirs), n.transition && yo(ge, n.transition), ce = ge, Ni(H), ce;
}
const Zf = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || zi(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, Jf = (e, t) => {
  const n = {};
  for (const s in e)
    (!oo(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function Qf(e, t, n) {
  const { props: s, children: i, component: r } = e, { props: o, children: a, patchFlag: l } = t, d = r.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && l >= 0) {
    if (l & 1024)
      return !0;
    if (l & 16)
      return s ? ba(s, o, d) : !!o;
    if (l & 8) {
      const c = t.dynamicProps;
      for (let w = 0; w < c.length; w++) {
        const k = c[w];
        if (o[k] !== s[k] && !Xi(d, k))
          return !0;
      }
    }
  } else
    return (i || a) && (!a || !a.$stable) ? !0 : s === o ? !1 : s ? o ? ba(s, o, d) : !0 : !!o;
  return !1;
}
function ba(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let i = 0; i < s.length; i++) {
    const r = s[i];
    if (t[r] !== e[r] && !Xi(n, r))
      return !0;
  }
  return !1;
}
function eh({ vnode: e, parent: t }, n) {
  for (; t; ) {
    const s = t.subTree;
    if (s.suspense && s.suspense.activeBranch === e && (s.el = e.el), s === e)
      (e = t.vnode).el = n, t = t.parent;
    else
      break;
  }
}
const oc = (e) => e.__isSuspense;
function th(e, t) {
  t && t.pendingBranch ? pe(e) ? t.effects.push(...e) : t.effects.push(e) : hf(e);
}
const De = Symbol.for("v-fgt"), Zi = Symbol.for("v-txt"), Pn = Symbol.for("v-cmt"), yi = Symbol.for("v-stc"), Us = [];
let $t = null;
function x(e = !1) {
  Us.push($t = e ? null : []);
}
function nh() {
  Us.pop(), $t = Us[Us.length - 1] || null;
}
let js = 1;
function wa(e, t = !1) {
  js += e, e < 0 && $t && t && ($t.hasOnce = !0);
}
function ac(e) {
  return e.dynamicChildren = js > 0 ? $t || ns : null, nh(), js > 0 && $t && $t.push(e), e;
}
function A(e, t, n, s, i, r) {
  return ac(
    b(
      e,
      t,
      n,
      s,
      i,
      r,
      !0
    )
  );
}
function lc(e, t, n, s, i) {
  return ac(
    an(
      e,
      t,
      n,
      s,
      i,
      !0
    )
  );
}
function cc(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function vs(e, t) {
  return e.type === t.type && e.key === t.key;
}
const uc = ({ key: e }) => e ?? null, vi = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? ct(e) || vt(e) || _e(e) ? { i: jt, r: e, k: t, f: !!n } : e : null);
function b(e, t = null, n = null, s = 0, i = null, r = e === De ? 0 : 1, o = !1, a = !1) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && uc(t),
    ref: t && vi(t),
    scopeId: Bl,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: r,
    patchFlag: s,
    dynamicProps: i,
    dynamicChildren: null,
    appContext: null,
    ctx: jt
  };
  return a ? (wo(l, n), r & 128 && e.normalize(l)) : n && (l.shapeFlag |= ct(n) ? 8 : 16), js > 0 && // avoid a block node from tracking itself
  !o && // has current parent block
  $t && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (l.patchFlag > 0 || r & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  l.patchFlag !== 32 && $t.push(l), l;
}
const an = sh;
function sh(e, t = null, n = null, s = 0, i = null, r = !1) {
  if ((!e || e === Sf) && (e = Pn), cc(e)) {
    const a = cs(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && wo(a, n), js > 0 && !r && $t && (a.shapeFlag & 6 ? $t[$t.indexOf(e)] = a : $t.push(a)), a.patchFlag = -2, a;
  }
  if (ph(e) && (e = e.__vccOpts), t) {
    t = ih(t);
    let { class: a, style: l } = t;
    a && !ct(a) && (t.class = Fe(a)), it(l) && (mo(l) && !pe(l) && (l = bt({}, l)), t.style = ke(l));
  }
  const o = ct(e) ? 1 : oc(e) ? 128 : gf(e) ? 64 : it(e) ? 4 : _e(e) ? 2 : 0;
  return b(
    e,
    t,
    n,
    s,
    i,
    o,
    r,
    !0
  );
}
function ih(e) {
  return e ? mo(e) || Yl(e) ? bt({}, e) : e : null;
}
function cs(e, t, n = !1, s = !1) {
  const { props: i, ref: r, patchFlag: o, children: a, transition: l } = e, d = t ? rh(i || {}, t) : i, c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: d,
    key: d && uc(d),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && r ? pe(r) ? r.concat(vi(t)) : [r, vi(t)] : vi(t)
    ) : r,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: a,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== De ? o === -1 ? 16 : o | 16 : o,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: l,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && cs(e.ssContent),
    ssFallback: e.ssFallback && cs(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return l && s && yo(
    c,
    l.clone(c)
  ), c;
}
function dn(e = " ", t = 0) {
  return an(Zi, null, e, t);
}
function zn(e, t) {
  const n = an(yi, null, e);
  return n.staticCount = t, n;
}
function se(e = "", t = !1) {
  return t ? (x(), lc(Pn, null, e)) : an(Pn, null, e);
}
function rn(e) {
  return e == null || typeof e == "boolean" ? an(Pn) : pe(e) ? an(
    De,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : cc(e) ? Rn(e) : an(Zi, null, String(e));
}
function Rn(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : cs(e);
}
function wo(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (pe(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const i = t.default;
      i && (i._c && (i._d = !1), wo(e, i()), i._c && (i._d = !0));
      return;
    } else {
      n = 32;
      const i = t._;
      !i && !Yl(t) ? t._ctx = jt : i === 3 && jt && (jt.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else _e(t) ? (t = { default: t, _ctx: jt }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [dn(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function rh(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const i in s)
      if (i === "class")
        t.class !== s.class && (t.class = Fe([t.class, s.class]));
      else if (i === "style")
        t.style = ke([t.style, s.style]);
      else if (zi(i)) {
        const r = t[i], o = s[i];
        o && r !== o && !(pe(r) && r.includes(o)) && (t[i] = r ? [].concat(r, o) : o);
      } else i !== "" && (t[i] = s[i]);
  }
  return t;
}
function tn(e, t, n, s = null) {
  cn(e, t, 7, [
    n,
    s
  ]);
}
const oh = Vl();
let ah = 0;
function lh(e, t, n) {
  const s = e.type, i = (t ? t.appContext : e.appContext) || oh, r = {
    uid: ah++,
    vnode: e,
    type: s,
    parent: t,
    appContext: i,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new Pu(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(i.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: Zl(s, i),
    emitsOptions: rc(s, i),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: Qe,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: Qe,
    data: Qe,
    props: Qe,
    attrs: Qe,
    slots: Qe,
    refs: Qe,
    setupState: Qe,
    setupContext: null,
    // suspense related
    suspense: n,
    suspenseId: n ? n.pendingId : 0,
    asyncDep: null,
    asyncResolved: !1,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: !1,
    isUnmounted: !1,
    isDeactivated: !1,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  return r.ctx = { _: r }, r.root = t ? t.root : r, r.emit = Xf.bind(null, r), e.ce && e.ce(r), r;
}
let Et = null;
const ch = () => Et || jt;
let Mi, Vr;
{
  const e = Wi(), t = (n, s) => {
    let i;
    return (i = e[n]) || (i = e[n] = []), i.push(s), (r) => {
      i.length > 1 ? i.forEach((o) => o(r)) : i[0](r);
    };
  };
  Mi = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => Et = n
  ), Vr = t(
    "__VUE_SSR_SETTERS__",
    (n) => Vs = n
  );
}
const Xs = (e) => {
  const t = Et;
  return Mi(e), e.scope.on(), () => {
    e.scope.off(), Mi(t);
  };
}, ka = () => {
  Et && Et.scope.off(), Mi(null);
};
function fc(e) {
  return e.vnode.shapeFlag & 4;
}
let Vs = !1;
function uh(e, t = !1, n = !1) {
  t && Vr(t);
  const { props: s, children: i } = e.vnode, r = fc(e);
  Ff(e, s, r, t), Uf(e, i, n || t);
  const o = r ? fh(e, t) : void 0;
  return t && Vr(!1), o;
}
function fh(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Ef);
  const { setup: s } = n;
  if (s) {
    bn();
    const i = e.setupContext = s.length > 1 ? dh(e) : null, r = Xs(e), o = Gs(
      s,
      e,
      0,
      [
        e.props,
        i
      ]
    ), a = fl(o);
    if (wn(), r(), (a || e.sp) && !Bs(e) && Ul(e), a) {
      if (o.then(ka, ka), t)
        return o.then((l) => {
          xa(e, l);
        }).catch((l) => {
          Ki(l, e, 0);
        });
      e.asyncDep = o;
    } else
      xa(e, o);
  } else
    hc(e);
}
function xa(e, t, n) {
  _e(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : it(t) && (e.setupState = Nl(t)), hc(e);
}
function hc(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || on);
  {
    const i = Xs(e);
    bn();
    try {
      Cf(e);
    } finally {
      wn(), i();
    }
  }
}
const hh = {
  get(e, t) {
    return yt(e, "get", ""), e[t];
  }
};
function dh(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, hh),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Ji(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Nl(tf(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in $s)
        return $s[n](e);
    },
    has(t, n) {
      return n in t || n in $s;
    }
  })) : e.proxy;
}
function ph(e) {
  return _e(e) && "__vccOpts" in e;
}
const le = (e, t) => af(e, t, Vs), gh = "3.5.18";
/**
* @vue/runtime-dom v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Kr;
const Aa = typeof window < "u" && window.trustedTypes;
if (Aa)
  try {
    Kr = /* @__PURE__ */ Aa.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const dc = Kr ? (e) => Kr.createHTML(e) : (e) => e, mh = "http://www.w3.org/2000/svg", _h = "http://www.w3.org/1998/Math/MathML", gn = typeof document < "u" ? document : null, Ta = gn && /* @__PURE__ */ gn.createElement("template"), yh = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const i = t === "svg" ? gn.createElementNS(mh, e) : t === "mathml" ? gn.createElementNS(_h, e) : n ? gn.createElement(e, { is: n }) : gn.createElement(e);
    return e === "select" && s && s.multiple != null && i.setAttribute("multiple", s.multiple), i;
  },
  createText: (e) => gn.createTextNode(e),
  createComment: (e) => gn.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => gn.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, s, i, r) {
    const o = n ? n.previousSibling : t.lastChild;
    if (i && (i === r || i.nextSibling))
      for (; t.insertBefore(i.cloneNode(!0), n), !(i === r || !(i = i.nextSibling)); )
        ;
    else {
      Ta.innerHTML = dc(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const a = Ta.content;
      if (s === "svg" || s === "mathml") {
        const l = a.firstChild;
        for (; l.firstChild; )
          a.appendChild(l.firstChild);
        a.removeChild(l);
      }
      t.insertBefore(a, n);
    }
    return [
      // first
      o ? o.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, vh = Symbol("_vtc");
function bh(e, t, n) {
  const s = e[vh];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const Fi = Symbol("_vod"), pc = Symbol("_vsh"), wh = {
  beforeMount(e, { value: t }, { transition: n }) {
    e[Fi] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : bs(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: s }) {
    !t != !n && (s ? t ? (s.beforeEnter(e), bs(e, !0), s.enter(e)) : s.leave(e, () => {
      bs(e, !1);
    }) : bs(e, t));
  },
  beforeUnmount(e, { value: t }) {
    bs(e, t);
  }
};
function bs(e, t) {
  e.style.display = t ? e[Fi] : "none", e[pc] = !t;
}
const kh = Symbol(""), xh = /(^|;)\s*display\s*:/;
function Ah(e, t, n) {
  const s = e.style, i = ct(n);
  let r = !1;
  if (n && !i) {
    if (t)
      if (ct(t))
        for (const o of t.split(";")) {
          const a = o.slice(0, o.indexOf(":")).trim();
          n[a] == null && bi(s, a, "");
        }
      else
        for (const o in t)
          n[o] == null && bi(s, o, "");
    for (const o in n)
      o === "display" && (r = !0), bi(s, o, n[o]);
  } else if (i) {
    if (t !== n) {
      const o = s[kh];
      o && (n += ";" + o), s.cssText = n, r = xh.test(n);
    }
  } else t && e.removeAttribute("style");
  Fi in e && (e[Fi] = r ? s.display : "", e[pc] && (s.display = "none"));
}
const Sa = /\s*!important$/;
function bi(e, t, n) {
  if (pe(n))
    n.forEach((s) => bi(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = Th(e, t);
    Sa.test(n) ? e.setProperty(
      Fn(s),
      n.replace(Sa, ""),
      "important"
    ) : e[s] = n;
  }
}
const Ea = ["Webkit", "Moz", "ms"], kr = {};
function Th(e, t) {
  const n = kr[t];
  if (n)
    return n;
  let s = On(t);
  if (s !== "filter" && s in e)
    return kr[t] = s;
  s = pl(s);
  for (let i = 0; i < Ea.length; i++) {
    const r = Ea[i] + s;
    if (r in e)
      return kr[t] = r;
  }
  return t;
}
const Ca = "http://www.w3.org/1999/xlink";
function Ra(e, t, n, s, i, r = Nu(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Ca, t.slice(6, t.length)) : e.setAttributeNS(Ca, t, n) : n == null || r && !gl(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    r ? "" : Mn(n) ? String(n) : n
  );
}
function Ia(e, t, n, s, i) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? dc(n) : n);
    return;
  }
  const r = e.tagName;
  if (t === "value" && r !== "PROGRESS" && // custom elements may use _value internally
  !r.includes("-")) {
    const a = r === "OPTION" ? e.getAttribute("value") || "" : e.value, l = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (a !== l || !("_value" in e)) && (e.value = l), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let o = !1;
  if (n === "" || n == null) {
    const a = typeof e[t];
    a === "boolean" ? n = gl(n) : n == null && a === "string" ? (n = "", o = !0) : a === "number" && (n = 0, o = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  o && e.removeAttribute(i || t);
}
function ts(e, t, n, s) {
  e.addEventListener(t, n, s);
}
function Sh(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const La = Symbol("_vei");
function Eh(e, t, n, s, i = null) {
  const r = e[La] || (e[La] = {}), o = r[t];
  if (s && o)
    o.value = s;
  else {
    const [a, l] = Ch(t);
    if (s) {
      const d = r[t] = Lh(
        s,
        i
      );
      ts(e, a, d, l);
    } else o && (Sh(e, a, o, l), r[t] = void 0);
  }
}
const Oa = /(?:Once|Passive|Capture)$/;
function Ch(e) {
  let t;
  if (Oa.test(e)) {
    t = {};
    let s;
    for (; s = e.match(Oa); )
      e = e.slice(0, e.length - s[0].length), t[s[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : Fn(e.slice(2)), t];
}
let xr = 0;
const Rh = /* @__PURE__ */ Promise.resolve(), Ih = () => xr || (Rh.then(() => xr = 0), xr = Date.now());
function Lh(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    cn(
      Oh(s, n.value),
      t,
      5,
      [s]
    );
  };
  return n.value = e, n.attached = Ih(), n;
}
function Oh(e, t) {
  if (pe(t)) {
    const n = e.stopImmediatePropagation;
    return e.stopImmediatePropagation = () => {
      n.call(e), e._stopped = !0;
    }, t.map(
      (s) => (i) => !i._stopped && s && s(i)
    );
  } else
    return t;
}
const Na = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Nh = (e, t, n, s, i, r) => {
  const o = i === "svg";
  t === "class" ? bh(e, s, o) : t === "style" ? Ah(e, n, s) : zi(t) ? oo(t) || Eh(e, t, n, s, r) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Ph(e, t, s, o)) ? (Ia(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Ra(e, t, s, o, r, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && (/[A-Z]/.test(t) || !ct(s)) ? Ia(e, On(t), s, r, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), Ra(e, t, s, o));
};
function Ph(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && Na(t) && _e(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const i = e.tagName;
    if (i === "IMG" || i === "VIDEO" || i === "CANVAS" || i === "SOURCE")
      return !1;
  }
  return Na(t) && ct(n) ? !1 : t in e;
}
const Pa = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return pe(t) ? (n) => mi(t, n) : t;
};
function Mh(e) {
  e.target.composing = !0;
}
function Ma(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const Ar = Symbol("_assign"), Hn = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, i) {
    e[Ar] = Pa(i);
    const r = s || i.props && i.props.type === "number";
    ts(e, t ? "change" : "input", (o) => {
      if (o.target.composing) return;
      let a = e.value;
      n && (a = a.trim()), r && (a = Dr(a)), e[Ar](a);
    }), n && ts(e, "change", () => {
      e.value = e.value.trim();
    }), t || (ts(e, "compositionstart", Mh), ts(e, "compositionend", Ma), ts(e, "change", Ma));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: i, number: r } }, o) {
    if (e[Ar] = Pa(o), e.composing) return;
    const a = (r || e.type === "number") && !/^0\d/.test(e.value) ? Dr(e.value) : e.value, l = t ?? "";
    a !== l && (document.activeElement === e && e.type !== "range" && (s && t === n || i && e.value.trim() === l) || (e.value = l));
  }
}, Fh = ["ctrl", "shift", "alt", "meta"], Dh = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !e.ctrlKey,
  shift: (e) => !e.shiftKey,
  alt: (e) => !e.altKey,
  meta: (e) => !e.metaKey,
  left: (e) => "button" in e && e.button !== 0,
  middle: (e) => "button" in e && e.button !== 1,
  right: (e) => "button" in e && e.button !== 2,
  exact: (e, t) => Fh.some((n) => e[`${n}Key`] && !t.includes(n))
}, Wn = (e, t) => {
  const n = e._withMods || (e._withMods = {}), s = t.join(".");
  return n[s] || (n[s] = (i, ...r) => {
    for (let o = 0; o < t.length; o++) {
      const a = Dh[t[o]];
      if (a && a(i, t)) return;
    }
    return e(i, ...r);
  });
}, Bh = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, wi = (e, t) => {
  const n = e._withKeys || (e._withKeys = {}), s = t.join(".");
  return n[s] || (n[s] = (i) => {
    if (!("key" in i))
      return;
    const r = Fn(i.key);
    if (t.some(
      (o) => o === r || Bh[o] === r
    ))
      return e(i);
  });
}, $h = /* @__PURE__ */ bt({ patchProp: Nh }, yh);
let Fa;
function Uh() {
  return Fa || (Fa = Hf($h));
}
const zh = (...e) => {
  const t = Uh().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const i = qh(s);
    if (!i) return;
    const r = t._component;
    !_e(r) && !r.render && !r.template && (r.template = i.innerHTML), i.nodeType === 1 && (i.textContent = "");
    const o = n(i, !1, Hh(i));
    return i instanceof Element && (i.removeAttribute("v-cloak"), i.setAttribute("data-v-app", "")), o;
  }, t;
};
function Hh(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function qh(e) {
  return ct(e) ? document.querySelector(e) : e;
}
const ls = (e) => {
  const t = e.replace("#", ""), n = parseInt(t.substr(0, 2), 16), s = parseInt(t.substr(2, 2), 16), i = parseInt(t.substr(4, 2), 16);
  return (n * 299 + s * 587 + i * 114) / 1e3 < 128;
}, Wh = (e, t) => {
  const n = e.replace("#", ""), s = parseInt(n.substr(0, 2), 16), i = parseInt(n.substr(2, 2), 16), r = parseInt(n.substr(4, 2), 16), o = ls(e), a = o ? Math.min(255, s + t) : Math.max(0, s - t), l = o ? Math.min(255, i + t) : Math.max(0, i - t), d = o ? Math.min(255, r + t) : Math.max(0, r - t);
  return `#${a.toString(16).padStart(2, "0")}${l.toString(16).padStart(2, "0")}${d.toString(16).padStart(2, "0")}`;
}, ws = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e), jh = (e) => {
  switch (e.type) {
    case "connection_error":
      return "Unable to connect. Please try again later.";
    case "auth_error":
      return "Authentication failed. Please refresh the page.";
    case "chat_error":
      return "Unable to send message. Please try again.";
    case "ai_config_missing":
      return "Chat service is currently unavailable.";
    default:
      return e.error || "Something went wrong. Please try again.";
  }
};
function ko() {
  return {
    async: !1,
    breaks: !1,
    extensions: null,
    gfm: !0,
    hooks: null,
    pedantic: !1,
    renderer: null,
    silent: !1,
    tokenizer: null,
    walkTokens: null
  };
}
var Kn = ko();
function gc(e) {
  Kn = e;
}
var zs = { exec: () => null };
function We(e, t = "") {
  let n = typeof e == "string" ? e : e.source;
  const s = {
    replace: (i, r) => {
      let o = typeof r == "string" ? r : r.source;
      return o = o.replace(Ct.caret, "$1"), n = n.replace(i, o), s;
    },
    getRegex: () => new RegExp(n, t)
  };
  return s;
}
var Ct = {
  codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
  outputLinkReplace: /\\([\[\]])/g,
  indentCodeCompensation: /^(\s+)(?:```)/,
  beginningSpace: /^\s+/,
  endingHash: /#$/,
  startingSpaceChar: /^ /,
  endingSpaceChar: / $/,
  nonSpaceChar: /[^ ]/,
  newLineCharGlobal: /\n/g,
  tabCharGlobal: /\t/g,
  multipleSpaceGlobal: /\s+/g,
  blankLine: /^[ \t]*$/,
  doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
  blockquoteStart: /^ {0,3}>/,
  blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
  blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
  listReplaceTabs: /^\t+/,
  listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
  listIsTask: /^\[[ xX]\] /,
  listReplaceTask: /^\[[ xX]\] +/,
  anyLine: /\n.*\n/,
  hrefBrackets: /^<(.*)>$/,
  tableDelimiter: /[:|]/,
  tableAlignChars: /^\||\| *$/g,
  tableRowBlankLine: /\n[ \t]*$/,
  tableAlignRight: /^ *-+: *$/,
  tableAlignCenter: /^ *:-+: *$/,
  tableAlignLeft: /^ *:-+ *$/,
  startATag: /^<a /i,
  endATag: /^<\/a>/i,
  startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
  endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
  startAngleBracket: /^</,
  endAngleBracket: />$/,
  pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
  unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
  escapeTest: /[&<>"']/,
  escapeReplace: /[&<>"']/g,
  escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
  escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
  unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,
  caret: /(^|[^\[])\^/g,
  percentDecode: /%25/g,
  findPipe: /\|/g,
  splitPipe: / \|/,
  slashPipe: /\\\|/g,
  carriageReturn: /\r\n|\r/g,
  spaceLine: /^ +$/gm,
  notSpaceStart: /^\S*/,
  endingNewline: /\n$/,
  listItemRegex: (e) => new RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),
  nextBulletRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
  hrRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
  fencesBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}(?:\`\`\`|~~~)`),
  headingBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}#`),
  htmlBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}<(?:[a-z].*>|!--)`, "i")
}, Vh = /^(?:[ \t]*(?:\n|$))+/, Kh = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Gh = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Zs = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Yh = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, xo = /(?:[*+-]|\d{1,9}[.)])/, mc = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, _c = We(mc).replace(/bull/g, xo).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Xh = We(mc).replace(/bull/g, xo).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), Ao = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Zh = /^[^\n]+/, To = /(?!\s*\])(?:\\.|[^\[\]\\])+/, Jh = We(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", To).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Qh = We(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, xo).getRegex(), Qi = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", So = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, ed = We(
  "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))",
  "i"
).replace("comment", So).replace("tag", Qi).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), yc = We(Ao).replace("hr", Zs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Qi).getRegex(), td = We(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", yc).getRegex(), Eo = {
  blockquote: td,
  code: Kh,
  def: Jh,
  fences: Gh,
  heading: Yh,
  hr: Zs,
  html: ed,
  lheading: _c,
  list: Qh,
  newline: Vh,
  paragraph: yc,
  table: zs,
  text: Zh
}, Da = We(
  "^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
).replace("hr", Zs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Qi).getRegex(), nd = {
  ...Eo,
  lheading: Xh,
  table: Da,
  paragraph: We(Ao).replace("hr", Zs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Da).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Qi).getRegex()
}, sd = {
  ...Eo,
  html: We(
    `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`
  ).replace("comment", So).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: zs,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: We(Ao).replace("hr", Zs).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", _c).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, id = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, rd = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, vc = /^( {2,}|\\)\n(?!\s*$)/, od = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, er = /[\p{P}\p{S}]/u, Co = /[\s\p{P}\p{S}]/u, bc = /[^\s\p{P}\p{S}]/u, ad = We(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Co).getRegex(), wc = /(?!~)[\p{P}\p{S}]/u, ld = /(?!~)[\s\p{P}\p{S}]/u, cd = /(?:[^\s\p{P}\p{S}]|~)/u, ud = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, kc = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, fd = We(kc, "u").replace(/punct/g, er).getRegex(), hd = We(kc, "u").replace(/punct/g, wc).getRegex(), xc = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", dd = We(xc, "gu").replace(/notPunctSpace/g, bc).replace(/punctSpace/g, Co).replace(/punct/g, er).getRegex(), pd = We(xc, "gu").replace(/notPunctSpace/g, cd).replace(/punctSpace/g, ld).replace(/punct/g, wc).getRegex(), gd = We(
  "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)",
  "gu"
).replace(/notPunctSpace/g, bc).replace(/punctSpace/g, Co).replace(/punct/g, er).getRegex(), md = We(/\\(punct)/, "gu").replace(/punct/g, er).getRegex(), _d = We(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), yd = We(So).replace("(?:-->|$)", "-->").getRegex(), vd = We(
  "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>"
).replace("comment", yd).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Di = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, bd = We(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", Di).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Ac = We(/^!?\[(label)\]\[(ref)\]/).replace("label", Di).replace("ref", To).getRegex(), Tc = We(/^!?\[(ref)\](?:\[\])?/).replace("ref", To).getRegex(), wd = We("reflink|nolink(?!\\()", "g").replace("reflink", Ac).replace("nolink", Tc).getRegex(), Ro = {
  _backpedal: zs,
  // only used for GFM url
  anyPunctuation: md,
  autolink: _d,
  blockSkip: ud,
  br: vc,
  code: rd,
  del: zs,
  emStrongLDelim: fd,
  emStrongRDelimAst: dd,
  emStrongRDelimUnd: gd,
  escape: id,
  link: bd,
  nolink: Tc,
  punctuation: ad,
  reflink: Ac,
  reflinkSearch: wd,
  tag: vd,
  text: od,
  url: zs
}, kd = {
  ...Ro,
  link: We(/^!?\[(label)\]\((.*?)\)/).replace("label", Di).getRegex(),
  reflink: We(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Di).getRegex()
}, Gr = {
  ...Ro,
  emStrongRDelimAst: pd,
  emStrongLDelim: hd,
  url: We(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, xd = {
  ...Gr,
  br: We(vc).replace("{2,}", "*").getRegex(),
  text: We(Gr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, fi = {
  normal: Eo,
  gfm: nd,
  pedantic: sd
}, ks = {
  normal: Ro,
  gfm: Gr,
  breaks: xd,
  pedantic: kd
}, Ad = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Ba = (e) => Ad[e];
function nn(e, t) {
  if (t) {
    if (Ct.escapeTest.test(e))
      return e.replace(Ct.escapeReplace, Ba);
  } else if (Ct.escapeTestNoEncode.test(e))
    return e.replace(Ct.escapeReplaceNoEncode, Ba);
  return e;
}
function $a(e) {
  try {
    e = encodeURI(e).replace(Ct.percentDecode, "%");
  } catch {
    return null;
  }
  return e;
}
function Ua(e, t) {
  var r;
  const n = e.replace(Ct.findPipe, (o, a, l) => {
    let d = !1, c = a;
    for (; --c >= 0 && l[c] === "\\"; ) d = !d;
    return d ? "|" : " |";
  }), s = n.split(Ct.splitPipe);
  let i = 0;
  if (s[0].trim() || s.shift(), s.length > 0 && !((r = s.at(-1)) != null && r.trim()) && s.pop(), t)
    if (s.length > t)
      s.splice(t);
    else
      for (; s.length < t; ) s.push("");
  for (; i < s.length; i++)
    s[i] = s[i].trim().replace(Ct.slashPipe, "|");
  return s;
}
function xs(e, t, n) {
  const s = e.length;
  if (s === 0)
    return "";
  let i = 0;
  for (; i < s && e.charAt(s - i - 1) === t; )
    i++;
  return e.slice(0, s - i);
}
function Td(e, t) {
  if (e.indexOf(t[1]) === -1)
    return -1;
  let n = 0;
  for (let s = 0; s < e.length; s++)
    if (e[s] === "\\")
      s++;
    else if (e[s] === t[0])
      n++;
    else if (e[s] === t[1] && (n--, n < 0))
      return s;
  return n > 0 ? -2 : -1;
}
function za(e, t, n, s, i) {
  const r = t.href, o = t.title || null, a = e[1].replace(i.other.outputLinkReplace, "$1");
  s.state.inLink = !0;
  const l = {
    type: e[0].charAt(0) === "!" ? "image" : "link",
    raw: n,
    href: r,
    title: o,
    text: a,
    tokens: s.inlineTokens(a)
  };
  return s.state.inLink = !1, l;
}
function Sd(e, t, n) {
  const s = e.match(n.other.indentCodeCompensation);
  if (s === null)
    return t;
  const i = s[1];
  return t.split(`
`).map((r) => {
    const o = r.match(n.other.beginningSpace);
    if (o === null)
      return r;
    const [a] = o;
    return a.length >= i.length ? r.slice(i.length) : r;
  }).join(`
`);
}
var Bi = class {
  // set by the lexer
  constructor(e) {
    Je(this, "options");
    Je(this, "rules");
    // set by the lexer
    Je(this, "lexer");
    this.options = e || Kn;
  }
  space(e) {
    const t = this.rules.block.newline.exec(e);
    if (t && t[0].length > 0)
      return {
        type: "space",
        raw: t[0]
      };
  }
  code(e) {
    const t = this.rules.block.code.exec(e);
    if (t) {
      const n = t[0].replace(this.rules.other.codeRemoveIndent, "");
      return {
        type: "code",
        raw: t[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? n : xs(n, `
`)
      };
    }
  }
  fences(e) {
    const t = this.rules.block.fences.exec(e);
    if (t) {
      const n = t[0], s = Sd(n, t[3] || "", this.rules);
      return {
        type: "code",
        raw: n,
        lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
        text: s
      };
    }
  }
  heading(e) {
    const t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        const s = xs(n, "#");
        (this.options.pedantic || !s || this.rules.other.endingSpaceChar.test(s)) && (n = s.trim());
      }
      return {
        type: "heading",
        raw: t[0],
        depth: t[1].length,
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  hr(e) {
    const t = this.rules.block.hr.exec(e);
    if (t)
      return {
        type: "hr",
        raw: xs(t[0], `
`)
      };
  }
  blockquote(e) {
    const t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = xs(t[0], `
`).split(`
`), s = "", i = "";
      const r = [];
      for (; n.length > 0; ) {
        let o = !1;
        const a = [];
        let l;
        for (l = 0; l < n.length; l++)
          if (this.rules.other.blockquoteStart.test(n[l]))
            a.push(n[l]), o = !0;
          else if (!o)
            a.push(n[l]);
          else
            break;
        n = n.slice(l);
        const d = a.join(`
`), c = d.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        s = s ? `${s}
${d}` : d, i = i ? `${i}
${c}` : c;
        const w = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(c, r, !0), this.lexer.state.top = w, n.length === 0)
          break;
        const k = r.at(-1);
        if ((k == null ? void 0 : k.type) === "code")
          break;
        if ((k == null ? void 0 : k.type) === "blockquote") {
          const D = k, M = D.raw + `
` + n.join(`
`), G = this.blockquote(M);
          r[r.length - 1] = G, s = s.substring(0, s.length - D.raw.length) + G.raw, i = i.substring(0, i.length - D.text.length) + G.text;
          break;
        } else if ((k == null ? void 0 : k.type) === "list") {
          const D = k, M = D.raw + `
` + n.join(`
`), G = this.list(M);
          r[r.length - 1] = G, s = s.substring(0, s.length - k.raw.length) + G.raw, i = i.substring(0, i.length - D.raw.length) + G.raw, n = M.substring(r.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return {
        type: "blockquote",
        raw: s,
        tokens: r,
        text: i
      };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let n = t[1].trim();
      const s = n.length > 1, i = {
        type: "list",
        raw: "",
        ordered: s,
        start: s ? +n.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
      const r = this.rules.other.listItemRegex(n);
      let o = !1;
      for (; e; ) {
        let l = !1, d = "", c = "";
        if (!(t = r.exec(e)) || this.rules.block.hr.test(e))
          break;
        d = t[0], e = e.substring(d.length);
        let w = t[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (ce) => " ".repeat(3 * ce.length)), k = e.split(`
`, 1)[0], D = !w.trim(), M = 0;
        if (this.options.pedantic ? (M = 2, c = w.trimStart()) : D ? M = t[1].length + 1 : (M = t[2].search(this.rules.other.nonSpaceChar), M = M > 4 ? 1 : M, c = w.slice(M), M += t[1].length), D && this.rules.other.blankLine.test(k) && (d += k + `
`, e = e.substring(k.length + 1), l = !0), !l) {
          const ce = this.rules.other.nextBulletRegex(M), ue = this.rules.other.hrRegex(M), ge = this.rules.other.fencesBeginRegex(M), T = this.rules.other.headingBeginRegex(M), L = this.rules.other.htmlBeginRegex(M);
          for (; e; ) {
            const V = e.split(`
`, 1)[0];
            let K;
            if (k = V, this.options.pedantic ? (k = k.replace(this.rules.other.listReplaceNesting, "  "), K = k) : K = k.replace(this.rules.other.tabCharGlobal, "    "), ge.test(k) || T.test(k) || L.test(k) || ce.test(k) || ue.test(k))
              break;
            if (K.search(this.rules.other.nonSpaceChar) >= M || !k.trim())
              c += `
` + K.slice(M);
            else {
              if (D || w.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || ge.test(w) || T.test(w) || ue.test(w))
                break;
              c += `
` + k;
            }
            !D && !k.trim() && (D = !0), d += V + `
`, e = e.substring(V.length + 1), w = K.slice(M);
          }
        }
        i.loose || (o ? i.loose = !0 : this.rules.other.doubleBlankLine.test(d) && (o = !0));
        let G = null, H;
        this.options.gfm && (G = this.rules.other.listIsTask.exec(c), G && (H = G[0] !== "[ ] ", c = c.replace(this.rules.other.listReplaceTask, ""))), i.items.push({
          type: "list_item",
          raw: d,
          task: !!G,
          checked: H,
          loose: !1,
          text: c,
          tokens: []
        }), i.raw += d;
      }
      const a = i.items.at(-1);
      if (a)
        a.raw = a.raw.trimEnd(), a.text = a.text.trimEnd();
      else
        return;
      i.raw = i.raw.trimEnd();
      for (let l = 0; l < i.items.length; l++)
        if (this.lexer.state.top = !1, i.items[l].tokens = this.lexer.blockTokens(i.items[l].text, []), !i.loose) {
          const d = i.items[l].tokens.filter((w) => w.type === "space"), c = d.length > 0 && d.some((w) => this.rules.other.anyLine.test(w.raw));
          i.loose = c;
        }
      if (i.loose)
        for (let l = 0; l < i.items.length; l++)
          i.items[l].loose = !0;
      return i;
    }
  }
  html(e) {
    const t = this.rules.block.html.exec(e);
    if (t)
      return {
        type: "html",
        block: !0,
        raw: t[0],
        pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
        text: t[0]
      };
  }
  def(e) {
    const t = this.rules.block.def.exec(e);
    if (t) {
      const n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), s = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return {
        type: "def",
        tag: n,
        raw: t[0],
        href: s,
        title: i
      };
    }
  }
  table(e) {
    var o;
    const t = this.rules.block.table.exec(e);
    if (!t || !this.rules.other.tableDelimiter.test(t[2]))
      return;
    const n = Ua(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = (o = t[3]) != null && o.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], r = {
      type: "table",
      raw: t[0],
      header: [],
      align: [],
      rows: []
    };
    if (n.length === s.length) {
      for (const a of s)
        this.rules.other.tableAlignRight.test(a) ? r.align.push("right") : this.rules.other.tableAlignCenter.test(a) ? r.align.push("center") : this.rules.other.tableAlignLeft.test(a) ? r.align.push("left") : r.align.push(null);
      for (let a = 0; a < n.length; a++)
        r.header.push({
          text: n[a],
          tokens: this.lexer.inline(n[a]),
          header: !0,
          align: r.align[a]
        });
      for (const a of i)
        r.rows.push(Ua(a, r.header.length).map((l, d) => ({
          text: l,
          tokens: this.lexer.inline(l),
          header: !1,
          align: r.align[d]
        })));
      return r;
    }
  }
  lheading(e) {
    const t = this.rules.block.lheading.exec(e);
    if (t)
      return {
        type: "heading",
        raw: t[0],
        depth: t[2].charAt(0) === "=" ? 1 : 2,
        text: t[1],
        tokens: this.lexer.inline(t[1])
      };
  }
  paragraph(e) {
    const t = this.rules.block.paragraph.exec(e);
    if (t) {
      const n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return {
        type: "paragraph",
        raw: t[0],
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  text(e) {
    const t = this.rules.block.text.exec(e);
    if (t)
      return {
        type: "text",
        raw: t[0],
        text: t[0],
        tokens: this.lexer.inline(t[0])
      };
  }
  escape(e) {
    const t = this.rules.inline.escape.exec(e);
    if (t)
      return {
        type: "escape",
        raw: t[0],
        text: t[1]
      };
  }
  tag(e) {
    const t = this.rules.inline.tag.exec(e);
    if (t)
      return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
        type: "html",
        raw: t[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        block: !1,
        text: t[0]
      };
  }
  link(e) {
    const t = this.rules.inline.link.exec(e);
    if (t) {
      const n = t[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
        if (!this.rules.other.endAngleBracket.test(n))
          return;
        const r = xs(n.slice(0, -1), "\\");
        if ((n.length - r.length) % 2 === 0)
          return;
      } else {
        const r = Td(t[2], "()");
        if (r === -2)
          return;
        if (r > -1) {
          const a = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + r;
          t[2] = t[2].substring(0, r), t[0] = t[0].substring(0, a).trim(), t[3] = "";
        }
      }
      let s = t[2], i = "";
      if (this.options.pedantic) {
        const r = this.rules.other.pedanticHrefTitle.exec(s);
        r && (s = r[1], i = r[3]);
      } else
        i = t[3] ? t[3].slice(1, -1) : "";
      return s = s.trim(), this.rules.other.startAngleBracket.test(s) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), za(t, {
        href: s && s.replace(this.rules.inline.anyPunctuation, "$1"),
        title: i && i.replace(this.rules.inline.anyPunctuation, "$1")
      }, t[0], this.lexer, this.rules);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      const s = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), i = t[s.toLowerCase()];
      if (!i) {
        const r = n[0].charAt(0);
        return {
          type: "text",
          raw: r,
          text: r
        };
      }
      return za(n, i, n[0], this.lexer, this.rules);
    }
  }
  emStrong(e, t, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || s[3] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
    if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const r = [...s[0]].length - 1;
      let o, a, l = r, d = 0;
      const c = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c.lastIndex = 0, t = t.slice(-1 * e.length + r); (s = c.exec(t)) != null; ) {
        if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o) continue;
        if (a = [...o].length, s[3] || s[4]) {
          l += a;
          continue;
        } else if ((s[5] || s[6]) && r % 3 && !((r + a) % 3)) {
          d += a;
          continue;
        }
        if (l -= a, l > 0) continue;
        a = Math.min(a, a + l + d);
        const w = [...s[0]][0].length, k = e.slice(0, r + s.index + w + a);
        if (Math.min(r, a) % 2) {
          const M = k.slice(1, -1);
          return {
            type: "em",
            raw: k,
            text: M,
            tokens: this.lexer.inlineTokens(M)
          };
        }
        const D = k.slice(2, -2);
        return {
          type: "strong",
          raw: k,
          text: D,
          tokens: this.lexer.inlineTokens(D)
        };
      }
    }
  }
  codespan(e) {
    const t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(this.rules.other.newLineCharGlobal, " ");
      const s = this.rules.other.nonSpaceChar.test(n), i = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return s && i && (n = n.substring(1, n.length - 1)), {
        type: "codespan",
        raw: t[0],
        text: n
      };
    }
  }
  br(e) {
    const t = this.rules.inline.br.exec(e);
    if (t)
      return {
        type: "br",
        raw: t[0]
      };
  }
  del(e) {
    const t = this.rules.inline.del.exec(e);
    if (t)
      return {
        type: "del",
        raw: t[0],
        text: t[2],
        tokens: this.lexer.inlineTokens(t[2])
      };
  }
  autolink(e) {
    const t = this.rules.inline.autolink.exec(e);
    if (t) {
      let n, s;
      return t[2] === "@" ? (n = t[1], s = "mailto:" + n) : (n = t[1], s = n), {
        type: "link",
        raw: t[0],
        text: n,
        href: s,
        tokens: [
          {
            type: "text",
            raw: n,
            text: n
          }
        ]
      };
    }
  }
  url(e) {
    var n;
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let s, i;
      if (t[2] === "@")
        s = t[0], i = "mailto:" + s;
      else {
        let r;
        do
          r = t[0], t[0] = ((n = this.rules.inline._backpedal.exec(t[0])) == null ? void 0 : n[0]) ?? "";
        while (r !== t[0]);
        s = t[0], t[1] === "www." ? i = "http://" + t[0] : i = t[0];
      }
      return {
        type: "link",
        raw: t[0],
        text: s,
        href: i,
        tokens: [
          {
            type: "text",
            raw: s,
            text: s
          }
        ]
      };
    }
  }
  inlineText(e) {
    const t = this.rules.inline.text.exec(e);
    if (t) {
      const n = this.lexer.state.inRawBlock;
      return {
        type: "text",
        raw: t[0],
        text: t[0],
        escaped: n
      };
    }
  }
}, yn = class Yr {
  constructor(t) {
    Je(this, "tokens");
    Je(this, "options");
    Je(this, "state");
    Je(this, "tokenizer");
    Je(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = t || Kn, this.options.tokenizer = this.options.tokenizer || new Bi(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      other: Ct,
      block: fi.normal,
      inline: ks.normal
    };
    this.options.pedantic ? (n.block = fi.pedantic, n.inline = ks.pedantic) : this.options.gfm && (n.block = fi.gfm, this.options.breaks ? n.inline = ks.breaks : n.inline = ks.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: fi,
      inline: ks
    };
  }
  /**
   * Static Lex Method
   */
  static lex(t, n) {
    return new Yr(n).lex(t);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(t, n) {
    return new Yr(n).inlineTokens(t);
  }
  /**
   * Preprocessing
   */
  lex(t) {
    t = t.replace(Ct.carriageReturn, `
`), this.blockTokens(t, this.tokens);
    for (let n = 0; n < this.inlineQueue.length; n++) {
      const s = this.inlineQueue[n];
      this.inlineTokens(s.src, s.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(t, n = [], s = !1) {
    var i, r, o;
    for (this.options.pedantic && (t = t.replace(Ct.tabCharGlobal, "    ").replace(Ct.spaceLine, "")); t; ) {
      let a;
      if ((r = (i = this.options.extensions) == null ? void 0 : i.block) != null && r.some((d) => (a = d.call({ lexer: this }, t, n)) ? (t = t.substring(a.raw.length), n.push(a), !0) : !1))
        continue;
      if (a = this.tokenizer.space(t)) {
        t = t.substring(a.raw.length);
        const d = n.at(-1);
        a.raw.length === 1 && d !== void 0 ? d.raw += `
` : n.push(a);
        continue;
      }
      if (a = this.tokenizer.code(t)) {
        t = t.substring(a.raw.length);
        const d = n.at(-1);
        (d == null ? void 0 : d.type) === "paragraph" || (d == null ? void 0 : d.type) === "text" ? (d.raw += `
` + a.raw, d.text += `
` + a.text, this.inlineQueue.at(-1).src = d.text) : n.push(a);
        continue;
      }
      if (a = this.tokenizer.fences(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.heading(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.hr(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.blockquote(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.list(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.html(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.def(t)) {
        t = t.substring(a.raw.length);
        const d = n.at(-1);
        (d == null ? void 0 : d.type) === "paragraph" || (d == null ? void 0 : d.type) === "text" ? (d.raw += `
` + a.raw, d.text += `
` + a.raw, this.inlineQueue.at(-1).src = d.text) : this.tokens.links[a.tag] || (this.tokens.links[a.tag] = {
          href: a.href,
          title: a.title
        });
        continue;
      }
      if (a = this.tokenizer.table(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.lheading(t)) {
        t = t.substring(a.raw.length), n.push(a);
        continue;
      }
      let l = t;
      if ((o = this.options.extensions) != null && o.startBlock) {
        let d = 1 / 0;
        const c = t.slice(1);
        let w;
        this.options.extensions.startBlock.forEach((k) => {
          w = k.call({ lexer: this }, c), typeof w == "number" && w >= 0 && (d = Math.min(d, w));
        }), d < 1 / 0 && d >= 0 && (l = t.substring(0, d + 1));
      }
      if (this.state.top && (a = this.tokenizer.paragraph(l))) {
        const d = n.at(-1);
        s && (d == null ? void 0 : d.type) === "paragraph" ? (d.raw += `
` + a.raw, d.text += `
` + a.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = d.text) : n.push(a), s = l.length !== t.length, t = t.substring(a.raw.length);
        continue;
      }
      if (a = this.tokenizer.text(t)) {
        t = t.substring(a.raw.length);
        const d = n.at(-1);
        (d == null ? void 0 : d.type) === "text" ? (d.raw += `
` + a.raw, d.text += `
` + a.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = d.text) : n.push(a);
        continue;
      }
      if (t) {
        const d = "Infinite loop on byte: " + t.charCodeAt(0);
        if (this.options.silent) {
          console.error(d);
          break;
        } else
          throw new Error(d);
      }
    }
    return this.state.top = !0, n;
  }
  inline(t, n = []) {
    return this.inlineQueue.push({ src: t, tokens: n }), n;
  }
  /**
   * Lexing/Compiling
   */
  inlineTokens(t, n = []) {
    var a, l, d;
    let s = t, i = null;
    if (this.tokens.links) {
      const c = Object.keys(this.tokens.links);
      if (c.length > 0)
        for (; (i = this.tokenizer.rules.inline.reflinkSearch.exec(s)) != null; )
          c.includes(i[0].slice(i[0].lastIndexOf("[") + 1, -1)) && (s = s.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + s.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (i = this.tokenizer.rules.inline.anyPunctuation.exec(s)) != null; )
      s = s.slice(0, i.index) + "++" + s.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; (i = this.tokenizer.rules.inline.blockSkip.exec(s)) != null; )
      s = s.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + s.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    let r = !1, o = "";
    for (; t; ) {
      r || (o = ""), r = !1;
      let c;
      if ((l = (a = this.options.extensions) == null ? void 0 : a.inline) != null && l.some((k) => (c = k.call({ lexer: this }, t, n)) ? (t = t.substring(c.raw.length), n.push(c), !0) : !1))
        continue;
      if (c = this.tokenizer.escape(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.tag(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.link(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.reflink(t, this.tokens.links)) {
        t = t.substring(c.raw.length);
        const k = n.at(-1);
        c.type === "text" && (k == null ? void 0 : k.type) === "text" ? (k.raw += c.raw, k.text += c.text) : n.push(c);
        continue;
      }
      if (c = this.tokenizer.emStrong(t, s, o)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.codespan(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.br(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.del(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.autolink(t)) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      if (!this.state.inLink && (c = this.tokenizer.url(t))) {
        t = t.substring(c.raw.length), n.push(c);
        continue;
      }
      let w = t;
      if ((d = this.options.extensions) != null && d.startInline) {
        let k = 1 / 0;
        const D = t.slice(1);
        let M;
        this.options.extensions.startInline.forEach((G) => {
          M = G.call({ lexer: this }, D), typeof M == "number" && M >= 0 && (k = Math.min(k, M));
        }), k < 1 / 0 && k >= 0 && (w = t.substring(0, k + 1));
      }
      if (c = this.tokenizer.inlineText(w)) {
        t = t.substring(c.raw.length), c.raw.slice(-1) !== "_" && (o = c.raw.slice(-1)), r = !0;
        const k = n.at(-1);
        (k == null ? void 0 : k.type) === "text" ? (k.raw += c.raw, k.text += c.text) : n.push(c);
        continue;
      }
      if (t) {
        const k = "Infinite loop on byte: " + t.charCodeAt(0);
        if (this.options.silent) {
          console.error(k);
          break;
        } else
          throw new Error(k);
      }
    }
    return n;
  }
}, $i = class {
  // set by the parser
  constructor(e) {
    Je(this, "options");
    Je(this, "parser");
    this.options = e || Kn;
  }
  space(e) {
    return "";
  }
  code({ text: e, lang: t, escaped: n }) {
    var r;
    const s = (r = (t || "").match(Ct.notSpaceStart)) == null ? void 0 : r[0], i = e.replace(Ct.endingNewline, "") + `
`;
    return s ? '<pre><code class="language-' + nn(s) + '">' + (n ? i : nn(i, !0)) + `</code></pre>
` : "<pre><code>" + (n ? i : nn(i, !0)) + `</code></pre>
`;
  }
  blockquote({ tokens: e }) {
    return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
  }
  html({ text: e }) {
    return e;
  }
  heading({ tokens: e, depth: t }) {
    return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
  }
  hr(e) {
    return `<hr>
`;
  }
  list(e) {
    const t = e.ordered, n = e.start;
    let s = "";
    for (let o = 0; o < e.items.length; o++) {
      const a = e.items[o];
      s += this.listitem(a);
    }
    const i = t ? "ol" : "ul", r = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + i + r + `>
` + s + "</" + i + `>
`;
  }
  listitem(e) {
    var n;
    let t = "";
    if (e.task) {
      const s = this.checkbox({ checked: !!e.checked });
      e.loose ? ((n = e.tokens[0]) == null ? void 0 : n.type) === "paragraph" ? (e.tokens[0].text = s + " " + e.tokens[0].text, e.tokens[0].tokens && e.tokens[0].tokens.length > 0 && e.tokens[0].tokens[0].type === "text" && (e.tokens[0].tokens[0].text = s + " " + nn(e.tokens[0].tokens[0].text), e.tokens[0].tokens[0].escaped = !0)) : e.tokens.unshift({
        type: "text",
        raw: s + " ",
        text: s + " ",
        escaped: !0
      }) : t += s + " ";
    }
    return t += this.parser.parse(e.tokens, !!e.loose), `<li>${t}</li>
`;
  }
  checkbox({ checked: e }) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph({ tokens: e }) {
    return `<p>${this.parser.parseInline(e)}</p>
`;
  }
  table(e) {
    let t = "", n = "";
    for (let i = 0; i < e.header.length; i++)
      n += this.tablecell(e.header[i]);
    t += this.tablerow({ text: n });
    let s = "";
    for (let i = 0; i < e.rows.length; i++) {
      const r = e.rows[i];
      n = "";
      for (let o = 0; o < r.length; o++)
        n += this.tablecell(r[o]);
      s += this.tablerow({ text: n });
    }
    return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + s + `</table>
`;
  }
  tablerow({ text: e }) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e) {
    const t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
    return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
  }
  /**
   * span level renderer
   */
  strong({ tokens: e }) {
    return `<strong>${this.parser.parseInline(e)}</strong>`;
  }
  em({ tokens: e }) {
    return `<em>${this.parser.parseInline(e)}</em>`;
  }
  codespan({ text: e }) {
    return `<code>${nn(e, !0)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({ tokens: e }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({ href: e, title: t, tokens: n }) {
    const s = this.parser.parseInline(n), i = $a(e);
    if (i === null)
      return s;
    e = i;
    let r = '<a href="' + e + '"';
    return t && (r += ' title="' + nn(t) + '"'), r += ">" + s + "</a>", r;
  }
  image({ href: e, title: t, text: n, tokens: s }) {
    s && (n = this.parser.parseInline(s, this.parser.textRenderer));
    const i = $a(e);
    if (i === null)
      return nn(n);
    e = i;
    let r = `<img src="${e}" alt="${n}"`;
    return t && (r += ` title="${nn(t)}"`), r += ">", r;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : nn(e.text);
  }
}, Io = class {
  // no need for block level renderers
  strong({ text: e }) {
    return e;
  }
  em({ text: e }) {
    return e;
  }
  codespan({ text: e }) {
    return e;
  }
  del({ text: e }) {
    return e;
  }
  html({ text: e }) {
    return e;
  }
  text({ text: e }) {
    return e;
  }
  link({ text: e }) {
    return "" + e;
  }
  image({ text: e }) {
    return "" + e;
  }
  br() {
    return "";
  }
}, vn = class Xr {
  constructor(t) {
    Je(this, "options");
    Je(this, "renderer");
    Je(this, "textRenderer");
    this.options = t || Kn, this.options.renderer = this.options.renderer || new $i(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new Io();
  }
  /**
   * Static Parse Method
   */
  static parse(t, n) {
    return new Xr(n).parse(t);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(t, n) {
    return new Xr(n).parseInline(t);
  }
  /**
   * Parse Loop
   */
  parse(t, n = !0) {
    var i, r;
    let s = "";
    for (let o = 0; o < t.length; o++) {
      const a = t[o];
      if ((r = (i = this.options.extensions) == null ? void 0 : i.renderers) != null && r[a.type]) {
        const d = a, c = this.options.extensions.renderers[d.type].call({ parser: this }, d);
        if (c !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(d.type)) {
          s += c || "";
          continue;
        }
      }
      const l = a;
      switch (l.type) {
        case "space": {
          s += this.renderer.space(l);
          continue;
        }
        case "hr": {
          s += this.renderer.hr(l);
          continue;
        }
        case "heading": {
          s += this.renderer.heading(l);
          continue;
        }
        case "code": {
          s += this.renderer.code(l);
          continue;
        }
        case "table": {
          s += this.renderer.table(l);
          continue;
        }
        case "blockquote": {
          s += this.renderer.blockquote(l);
          continue;
        }
        case "list": {
          s += this.renderer.list(l);
          continue;
        }
        case "html": {
          s += this.renderer.html(l);
          continue;
        }
        case "paragraph": {
          s += this.renderer.paragraph(l);
          continue;
        }
        case "text": {
          let d = l, c = this.renderer.text(d);
          for (; o + 1 < t.length && t[o + 1].type === "text"; )
            d = t[++o], c += `
` + this.renderer.text(d);
          n ? s += this.renderer.paragraph({
            type: "paragraph",
            raw: c,
            text: c,
            tokens: [{ type: "text", raw: c, text: c, escaped: !0 }]
          }) : s += c;
          continue;
        }
        default: {
          const d = 'Token with "' + l.type + '" type was not found.';
          if (this.options.silent)
            return console.error(d), "";
          throw new Error(d);
        }
      }
    }
    return s;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(t, n = this.renderer) {
    var i, r;
    let s = "";
    for (let o = 0; o < t.length; o++) {
      const a = t[o];
      if ((r = (i = this.options.extensions) == null ? void 0 : i.renderers) != null && r[a.type]) {
        const d = this.options.extensions.renderers[a.type].call({ parser: this }, a);
        if (d !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(a.type)) {
          s += d || "";
          continue;
        }
      }
      const l = a;
      switch (l.type) {
        case "escape": {
          s += n.text(l);
          break;
        }
        case "html": {
          s += n.html(l);
          break;
        }
        case "link": {
          s += n.link(l);
          break;
        }
        case "image": {
          s += n.image(l);
          break;
        }
        case "strong": {
          s += n.strong(l);
          break;
        }
        case "em": {
          s += n.em(l);
          break;
        }
        case "codespan": {
          s += n.codespan(l);
          break;
        }
        case "br": {
          s += n.br(l);
          break;
        }
        case "del": {
          s += n.del(l);
          break;
        }
        case "text": {
          s += n.text(l);
          break;
        }
        default: {
          const d = 'Token with "' + l.type + '" type was not found.';
          if (this.options.silent)
            return console.error(d), "";
          throw new Error(d);
        }
      }
    }
    return s;
  }
}, Mr, ki = (Mr = class {
  constructor(e) {
    Je(this, "options");
    Je(this, "block");
    this.options = e || Kn;
  }
  /**
   * Process markdown before marked
   */
  preprocess(e) {
    return e;
  }
  /**
   * Process HTML after marked is finished
   */
  postprocess(e) {
    return e;
  }
  /**
   * Process all tokens before walk tokens
   */
  processAllTokens(e) {
    return e;
  }
  /**
   * Provide function to tokenize markdown
   */
  provideLexer() {
    return this.block ? yn.lex : yn.lexInline;
  }
  /**
   * Provide function to parse tokens
   */
  provideParser() {
    return this.block ? vn.parse : vn.parseInline;
  }
}, Je(Mr, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
])), Mr), Ed = class {
  constructor(...e) {
    Je(this, "defaults", ko());
    Je(this, "options", this.setOptions);
    Je(this, "parse", this.parseMarkdown(!0));
    Je(this, "parseInline", this.parseMarkdown(!1));
    Je(this, "Parser", vn);
    Je(this, "Renderer", $i);
    Je(this, "TextRenderer", Io);
    Je(this, "Lexer", yn);
    Je(this, "Tokenizer", Bi);
    Je(this, "Hooks", ki);
    this.use(...e);
  }
  /**
   * Run callback for every token
   */
  walkTokens(e, t) {
    var s, i;
    let n = [];
    for (const r of e)
      switch (n = n.concat(t.call(this, r)), r.type) {
        case "table": {
          const o = r;
          for (const a of o.header)
            n = n.concat(this.walkTokens(a.tokens, t));
          for (const a of o.rows)
            for (const l of a)
              n = n.concat(this.walkTokens(l.tokens, t));
          break;
        }
        case "list": {
          const o = r;
          n = n.concat(this.walkTokens(o.items, t));
          break;
        }
        default: {
          const o = r;
          (i = (s = this.defaults.extensions) == null ? void 0 : s.childTokens) != null && i[o.type] ? this.defaults.extensions.childTokens[o.type].forEach((a) => {
            const l = o[a].flat(1 / 0);
            n = n.concat(this.walkTokens(l, t));
          }) : o.tokens && (n = n.concat(this.walkTokens(o.tokens, t)));
        }
      }
    return n;
  }
  use(...e) {
    const t = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((n) => {
      const s = { ...n };
      if (s.async = this.defaults.async || s.async || !1, n.extensions && (n.extensions.forEach((i) => {
        if (!i.name)
          throw new Error("extension name required");
        if ("renderer" in i) {
          const r = t.renderers[i.name];
          r ? t.renderers[i.name] = function(...o) {
            let a = i.renderer.apply(this, o);
            return a === !1 && (a = r.apply(this, o)), a;
          } : t.renderers[i.name] = i.renderer;
        }
        if ("tokenizer" in i) {
          if (!i.level || i.level !== "block" && i.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const r = t[i.level];
          r ? r.unshift(i.tokenizer) : t[i.level] = [i.tokenizer], i.start && (i.level === "block" ? t.startBlock ? t.startBlock.push(i.start) : t.startBlock = [i.start] : i.level === "inline" && (t.startInline ? t.startInline.push(i.start) : t.startInline = [i.start]));
        }
        "childTokens" in i && i.childTokens && (t.childTokens[i.name] = i.childTokens);
      }), s.extensions = t), n.renderer) {
        const i = this.defaults.renderer || new $i(this.defaults);
        for (const r in n.renderer) {
          if (!(r in i))
            throw new Error(`renderer '${r}' does not exist`);
          if (["options", "parser"].includes(r))
            continue;
          const o = r, a = n.renderer[o], l = i[o];
          i[o] = (...d) => {
            let c = a.apply(i, d);
            return c === !1 && (c = l.apply(i, d)), c || "";
          };
        }
        s.renderer = i;
      }
      if (n.tokenizer) {
        const i = this.defaults.tokenizer || new Bi(this.defaults);
        for (const r in n.tokenizer) {
          if (!(r in i))
            throw new Error(`tokenizer '${r}' does not exist`);
          if (["options", "rules", "lexer"].includes(r))
            continue;
          const o = r, a = n.tokenizer[o], l = i[o];
          i[o] = (...d) => {
            let c = a.apply(i, d);
            return c === !1 && (c = l.apply(i, d)), c;
          };
        }
        s.tokenizer = i;
      }
      if (n.hooks) {
        const i = this.defaults.hooks || new ki();
        for (const r in n.hooks) {
          if (!(r in i))
            throw new Error(`hook '${r}' does not exist`);
          if (["options", "block"].includes(r))
            continue;
          const o = r, a = n.hooks[o], l = i[o];
          ki.passThroughHooks.has(r) ? i[o] = (d) => {
            if (this.defaults.async)
              return Promise.resolve(a.call(i, d)).then((w) => l.call(i, w));
            const c = a.call(i, d);
            return l.call(i, c);
          } : i[o] = (...d) => {
            let c = a.apply(i, d);
            return c === !1 && (c = l.apply(i, d)), c;
          };
        }
        s.hooks = i;
      }
      if (n.walkTokens) {
        const i = this.defaults.walkTokens, r = n.walkTokens;
        s.walkTokens = function(o) {
          let a = [];
          return a.push(r.call(this, o)), i && (a = a.concat(i.call(this, o))), a;
        };
      }
      this.defaults = { ...this.defaults, ...s };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, t) {
    return yn.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return vn.parse(e, t ?? this.defaults);
  }
  parseMarkdown(e) {
    return (n, s) => {
      const i = { ...s }, r = { ...this.defaults, ...i }, o = this.onError(!!r.silent, !!r.async);
      if (this.defaults.async === !0 && i.async === !1)
        return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null)
        return o(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string")
        return o(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      r.hooks && (r.hooks.options = r, r.hooks.block = e);
      const a = r.hooks ? r.hooks.provideLexer() : e ? yn.lex : yn.lexInline, l = r.hooks ? r.hooks.provideParser() : e ? vn.parse : vn.parseInline;
      if (r.async)
        return Promise.resolve(r.hooks ? r.hooks.preprocess(n) : n).then((d) => a(d, r)).then((d) => r.hooks ? r.hooks.processAllTokens(d) : d).then((d) => r.walkTokens ? Promise.all(this.walkTokens(d, r.walkTokens)).then(() => d) : d).then((d) => l(d, r)).then((d) => r.hooks ? r.hooks.postprocess(d) : d).catch(o);
      try {
        r.hooks && (n = r.hooks.preprocess(n));
        let d = a(n, r);
        r.hooks && (d = r.hooks.processAllTokens(d)), r.walkTokens && this.walkTokens(d, r.walkTokens);
        let c = l(d, r);
        return r.hooks && (c = r.hooks.postprocess(c)), c;
      } catch (d) {
        return o(d);
      }
    };
  }
  onError(e, t) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        const s = "<p>An error occurred:</p><pre>" + nn(n.message + "", !0) + "</pre>";
        return t ? Promise.resolve(s) : s;
      }
      if (t)
        return Promise.reject(n);
      throw n;
    };
  }
}, Vn = new Ed();
function Be(e, t) {
  return Vn.parse(e, t);
}
Be.options = Be.setOptions = function(e) {
  return Vn.setOptions(e), Be.defaults = Vn.defaults, gc(Be.defaults), Be;
};
Be.getDefaults = ko;
Be.defaults = Kn;
Be.use = function(...e) {
  return Vn.use(...e), Be.defaults = Vn.defaults, gc(Be.defaults), Be;
};
Be.walkTokens = function(e, t) {
  return Vn.walkTokens(e, t);
};
Be.parseInline = Vn.parseInline;
Be.Parser = vn;
Be.parser = vn.parse;
Be.Renderer = $i;
Be.TextRenderer = Io;
Be.Lexer = yn;
Be.lexer = yn.lex;
Be.Tokenizer = Bi;
Be.Hooks = ki;
Be.parse = Be;
Be.options;
Be.setOptions;
Be.use;
Be.walkTokens;
Be.parseInline;
vn.parse;
yn.lex;
/*! @license DOMPurify 3.2.6 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.2.6/LICENSE */
const {
  entries: Sc,
  setPrototypeOf: Ha,
  isFrozen: Cd,
  getPrototypeOf: Rd,
  getOwnPropertyDescriptor: Id
} = Object;
let {
  freeze: Rt,
  seal: Kt,
  create: Ec
} = Object, {
  apply: Zr,
  construct: Jr
} = typeof Reflect < "u" && Reflect;
Rt || (Rt = function(t) {
  return t;
});
Kt || (Kt = function(t) {
  return t;
});
Zr || (Zr = function(t, n, s) {
  return t.apply(n, s);
});
Jr || (Jr = function(t, n) {
  return new t(...n);
});
const hi = It(Array.prototype.forEach), Ld = It(Array.prototype.lastIndexOf), qa = It(Array.prototype.pop), As = It(Array.prototype.push), Od = It(Array.prototype.splice), xi = It(String.prototype.toLowerCase), Tr = It(String.prototype.toString), Wa = It(String.prototype.match), Ts = It(String.prototype.replace), Nd = It(String.prototype.indexOf), Pd = It(String.prototype.trim), Zt = It(Object.prototype.hasOwnProperty), At = It(RegExp.prototype.test), Ss = Md(TypeError);
function It(e) {
  return function(t) {
    t instanceof RegExp && (t.lastIndex = 0);
    for (var n = arguments.length, s = new Array(n > 1 ? n - 1 : 0), i = 1; i < n; i++)
      s[i - 1] = arguments[i];
    return Zr(e, t, s);
  };
}
function Md(e) {
  return function() {
    for (var t = arguments.length, n = new Array(t), s = 0; s < t; s++)
      n[s] = arguments[s];
    return Jr(e, n);
  };
}
function Ee(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : xi;
  Ha && Ha(e, null);
  let s = t.length;
  for (; s--; ) {
    let i = t[s];
    if (typeof i == "string") {
      const r = n(i);
      r !== i && (Cd(t) || (t[s] = r), i = r);
    }
    e[i] = !0;
  }
  return e;
}
function Fd(e) {
  for (let t = 0; t < e.length; t++)
    Zt(e, t) || (e[t] = null);
  return e;
}
function pn(e) {
  const t = Ec(null);
  for (const [n, s] of Sc(e))
    Zt(e, n) && (Array.isArray(s) ? t[n] = Fd(s) : s && typeof s == "object" && s.constructor === Object ? t[n] = pn(s) : t[n] = s);
  return t;
}
function Es(e, t) {
  for (; e !== null; ) {
    const s = Id(e, t);
    if (s) {
      if (s.get)
        return It(s.get);
      if (typeof s.value == "function")
        return It(s.value);
    }
    e = Rd(e);
  }
  function n() {
    return null;
  }
  return n;
}
const ja = Rt(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "section", "select", "shadow", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]), Sr = Rt(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]), Er = Rt(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]), Dd = Rt(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]), Cr = Rt(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]), Bd = Rt(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]), Va = Rt(["#text"]), Ka = Rt(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns", "slot"]), Rr = Rt(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]), Ga = Rt(["accent", "accentunder", "align", "bevelled", "close", "columnsalign", "columnlines", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lspace", "lquote", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]), di = Rt(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]), $d = Kt(/\{\{[\w\W]*|[\w\W]*\}\}/gm), Ud = Kt(/<%[\w\W]*|[\w\W]*%>/gm), zd = Kt(/\$\{[\w\W]*/gm), Hd = Kt(/^data-[\-\w.\u00B7-\uFFFF]+$/), qd = Kt(/^aria-[\-\w]+$/), Cc = Kt(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
), Wd = Kt(/^(?:\w+script|data):/i), jd = Kt(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
), Rc = Kt(/^html$/i), Vd = Kt(/^[a-z][.\w]*(-[.\w]+)+$/i);
var Ya = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ARIA_ATTR: qd,
  ATTR_WHITESPACE: jd,
  CUSTOM_ELEMENT: Vd,
  DATA_ATTR: Hd,
  DOCTYPE_NAME: Rc,
  ERB_EXPR: Ud,
  IS_ALLOWED_URI: Cc,
  IS_SCRIPT_OR_DATA: Wd,
  MUSTACHE_EXPR: $d,
  TMPLIT_EXPR: zd
});
const Cs = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9
}, Kd = function() {
  return typeof window > "u" ? null : window;
}, Gd = function(t, n) {
  if (typeof t != "object" || typeof t.createPolicy != "function")
    return null;
  let s = null;
  const i = "data-tt-policy-suffix";
  n && n.hasAttribute(i) && (s = n.getAttribute(i));
  const r = "dompurify" + (s ? "#" + s : "");
  try {
    return t.createPolicy(r, {
      createHTML(o) {
        return o;
      },
      createScriptURL(o) {
        return o;
      }
    });
  } catch {
    return console.warn("TrustedTypes policy " + r + " could not be created."), null;
  }
}, Xa = function() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
};
function Ic() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : Kd();
  const t = (j) => Ic(j);
  if (t.version = "3.2.6", t.removed = [], !e || !e.document || e.document.nodeType !== Cs.document || !e.Element)
    return t.isSupported = !1, t;
  let {
    document: n
  } = e;
  const s = n, i = s.currentScript, {
    DocumentFragment: r,
    HTMLTemplateElement: o,
    Node: a,
    Element: l,
    NodeFilter: d,
    NamedNodeMap: c = e.NamedNodeMap || e.MozNamedAttrMap,
    HTMLFormElement: w,
    DOMParser: k,
    trustedTypes: D
  } = e, M = l.prototype, G = Es(M, "cloneNode"), H = Es(M, "remove"), ce = Es(M, "nextSibling"), ue = Es(M, "childNodes"), ge = Es(M, "parentNode");
  if (typeof o == "function") {
    const j = n.createElement("template");
    j.content && j.content.ownerDocument && (n = j.content.ownerDocument);
  }
  let T, L = "";
  const {
    implementation: V,
    createNodeIterator: K,
    createDocumentFragment: xe,
    getElementsByTagName: Pe
  } = n, {
    importNode: Ke
  } = s;
  let Ce = Xa();
  t.isSupported = typeof Sc == "function" && typeof ge == "function" && V && V.createHTMLDocument !== void 0;
  const {
    MUSTACHE_EXPR: ye,
    ERB_EXPR: Ye,
    TMPLIT_EXPR: et,
    DATA_ATTR: rt,
    ARIA_ATTR: fe,
    IS_SCRIPT_OR_DATA: de,
    ATTR_WHITESPACE: ae,
    CUSTOM_ELEMENT: Te
  } = Ya;
  let {
    IS_ALLOWED_URI: tt
  } = Ya, oe = null;
  const Le = Ee({}, [...ja, ...Sr, ...Er, ...Cr, ...Va]);
  let Oe = null;
  const pt = Ee({}, [...Ka, ...Rr, ...Ga, ...di]);
  let Re = Object.seal(Ec(null, {
    tagNameCheck: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: null
    },
    attributeNameCheck: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: !1
    }
  })), ot = null, ut = null, Lt = !0, _t = !0, W = !1, st = !0, p = !1, m = !0, v = !1, N = !1, R = !1, I = !1, U = !1, z = !1, B = !0, F = !1;
  const J = "user-content-";
  let q = !0, Z = !1, te = {}, re = null;
  const me = Ee({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let Ae = null;
  const Ne = Ee({}, ["audio", "video", "img", "source", "image", "track"]);
  let je = null;
  const ft = Ee({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]), f = "http://www.w3.org/1998/Math/MathML", y = "http://www.w3.org/2000/svg", C = "http://www.w3.org/1999/xhtml";
  let S = C, $ = !1, Y = null;
  const ne = Ee({}, [f, y, C], Tr);
  let be = Ee({}, ["mi", "mo", "mn", "ms", "mtext"]), Se = Ee({}, ["annotation-xml"]);
  const Xe = Ee({}, ["title", "style", "font", "a", "script"]);
  let Me = null;
  const at = ["application/xhtml+xml", "text/html"], wt = "text/html";
  let Ve = null, Pt = null;
  const Js = n.createElement("form"), fs = function(_) {
    return _ instanceof RegExp || _ instanceof Function;
  }, Mt = function() {
    let _ = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (!(Pt && Pt === _)) {
      if ((!_ || typeof _ != "object") && (_ = {}), _ = pn(_), Me = // eslint-disable-next-line unicorn/prefer-includes
      at.indexOf(_.PARSER_MEDIA_TYPE) === -1 ? wt : _.PARSER_MEDIA_TYPE, Ve = Me === "application/xhtml+xml" ? Tr : xi, oe = Zt(_, "ALLOWED_TAGS") ? Ee({}, _.ALLOWED_TAGS, Ve) : Le, Oe = Zt(_, "ALLOWED_ATTR") ? Ee({}, _.ALLOWED_ATTR, Ve) : pt, Y = Zt(_, "ALLOWED_NAMESPACES") ? Ee({}, _.ALLOWED_NAMESPACES, Tr) : ne, je = Zt(_, "ADD_URI_SAFE_ATTR") ? Ee(pn(ft), _.ADD_URI_SAFE_ATTR, Ve) : ft, Ae = Zt(_, "ADD_DATA_URI_TAGS") ? Ee(pn(Ne), _.ADD_DATA_URI_TAGS, Ve) : Ne, re = Zt(_, "FORBID_CONTENTS") ? Ee({}, _.FORBID_CONTENTS, Ve) : me, ot = Zt(_, "FORBID_TAGS") ? Ee({}, _.FORBID_TAGS, Ve) : pn({}), ut = Zt(_, "FORBID_ATTR") ? Ee({}, _.FORBID_ATTR, Ve) : pn({}), te = Zt(_, "USE_PROFILES") ? _.USE_PROFILES : !1, Lt = _.ALLOW_ARIA_ATTR !== !1, _t = _.ALLOW_DATA_ATTR !== !1, W = _.ALLOW_UNKNOWN_PROTOCOLS || !1, st = _.ALLOW_SELF_CLOSE_IN_ATTR !== !1, p = _.SAFE_FOR_TEMPLATES || !1, m = _.SAFE_FOR_XML !== !1, v = _.WHOLE_DOCUMENT || !1, I = _.RETURN_DOM || !1, U = _.RETURN_DOM_FRAGMENT || !1, z = _.RETURN_TRUSTED_TYPE || !1, R = _.FORCE_BODY || !1, B = _.SANITIZE_DOM !== !1, F = _.SANITIZE_NAMED_PROPS || !1, q = _.KEEP_CONTENT !== !1, Z = _.IN_PLACE || !1, tt = _.ALLOWED_URI_REGEXP || Cc, S = _.NAMESPACE || C, be = _.MATHML_TEXT_INTEGRATION_POINTS || be, Se = _.HTML_INTEGRATION_POINTS || Se, Re = _.CUSTOM_ELEMENT_HANDLING || {}, _.CUSTOM_ELEMENT_HANDLING && fs(_.CUSTOM_ELEMENT_HANDLING.tagNameCheck) && (Re.tagNameCheck = _.CUSTOM_ELEMENT_HANDLING.tagNameCheck), _.CUSTOM_ELEMENT_HANDLING && fs(_.CUSTOM_ELEMENT_HANDLING.attributeNameCheck) && (Re.attributeNameCheck = _.CUSTOM_ELEMENT_HANDLING.attributeNameCheck), _.CUSTOM_ELEMENT_HANDLING && typeof _.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements == "boolean" && (Re.allowCustomizedBuiltInElements = _.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements), p && (_t = !1), U && (I = !0), te && (oe = Ee({}, Va), Oe = [], te.html === !0 && (Ee(oe, ja), Ee(Oe, Ka)), te.svg === !0 && (Ee(oe, Sr), Ee(Oe, Rr), Ee(Oe, di)), te.svgFilters === !0 && (Ee(oe, Er), Ee(Oe, Rr), Ee(Oe, di)), te.mathMl === !0 && (Ee(oe, Cr), Ee(Oe, Ga), Ee(Oe, di))), _.ADD_TAGS && (oe === Le && (oe = pn(oe)), Ee(oe, _.ADD_TAGS, Ve)), _.ADD_ATTR && (Oe === pt && (Oe = pn(Oe)), Ee(Oe, _.ADD_ATTR, Ve)), _.ADD_URI_SAFE_ATTR && Ee(je, _.ADD_URI_SAFE_ATTR, Ve), _.FORBID_CONTENTS && (re === me && (re = pn(re)), Ee(re, _.FORBID_CONTENTS, Ve)), q && (oe["#text"] = !0), v && Ee(oe, ["html", "head", "body"]), oe.table && (Ee(oe, ["tbody"]), delete ot.tbody), _.TRUSTED_TYPES_POLICY) {
        if (typeof _.TRUSTED_TYPES_POLICY.createHTML != "function")
          throw Ss('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
        if (typeof _.TRUSTED_TYPES_POLICY.createScriptURL != "function")
          throw Ss('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
        T = _.TRUSTED_TYPES_POLICY, L = T.createHTML("");
      } else
        T === void 0 && (T = Gd(D, i)), T !== null && typeof L == "string" && (L = T.createHTML(""));
      Rt && Rt(_), Pt = _;
    }
  }, Gn = Ee({}, [...Sr, ...Er, ...Dd]), en = Ee({}, [...Cr, ...Bd]), Qs = function(_) {
    let P = ge(_);
    (!P || !P.tagName) && (P = {
      namespaceURI: S,
      tagName: "template"
    });
    const X = xi(_.tagName), $e = xi(P.tagName);
    return Y[_.namespaceURI] ? _.namespaceURI === y ? P.namespaceURI === C ? X === "svg" : P.namespaceURI === f ? X === "svg" && ($e === "annotation-xml" || be[$e]) : !!Gn[X] : _.namespaceURI === f ? P.namespaceURI === C ? X === "math" : P.namespaceURI === y ? X === "math" && Se[$e] : !!en[X] : _.namespaceURI === C ? P.namespaceURI === y && !Se[$e] || P.namespaceURI === f && !be[$e] ? !1 : !en[X] && (Xe[X] || !Gn[X]) : !!(Me === "application/xhtml+xml" && Y[_.namespaceURI]) : !1;
  }, kt = function(_) {
    As(t.removed, {
      element: _
    });
    try {
      ge(_).removeChild(_);
    } catch {
      H(_);
    }
  }, fn = function(_, P) {
    try {
      As(t.removed, {
        attribute: P.getAttributeNode(_),
        from: P
      });
    } catch {
      As(t.removed, {
        attribute: null,
        from: P
      });
    }
    if (P.removeAttribute(_), _ === "is")
      if (I || U)
        try {
          kt(P);
        } catch {
        }
      else
        try {
          P.setAttribute(_, "");
        } catch {
        }
  }, xn = function(_) {
    let P = null, X = null;
    if (R)
      _ = "<remove></remove>" + _;
    else {
      const Ze = Wa(_, /^[\r\n\t ]+/);
      X = Ze && Ze[0];
    }
    Me === "application/xhtml+xml" && S === C && (_ = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + _ + "</body></html>");
    const $e = T ? T.createHTML(_) : _;
    if (S === C)
      try {
        P = new k().parseFromString($e, Me);
      } catch {
      }
    if (!P || !P.documentElement) {
      P = V.createDocument(S, "template", null);
      try {
        P.documentElement.innerHTML = $ ? L : $e;
      } catch {
      }
    }
    const ht = P.body || P.documentElement;
    return _ && X && ht.insertBefore(n.createTextNode(X), ht.childNodes[0] || null), S === C ? Pe.call(P, v ? "html" : "body")[0] : v ? P.documentElement : ht;
  }, ei = function(_) {
    return K.call(
      _.ownerDocument || _,
      _,
      // eslint-disable-next-line no-bitwise
      d.SHOW_ELEMENT | d.SHOW_COMMENT | d.SHOW_TEXT | d.SHOW_PROCESSING_INSTRUCTION | d.SHOW_CDATA_SECTION,
      null
    );
  }, An = function(_) {
    return _ instanceof w && (typeof _.nodeName != "string" || typeof _.textContent != "string" || typeof _.removeChild != "function" || !(_.attributes instanceof c) || typeof _.removeAttribute != "function" || typeof _.setAttribute != "function" || typeof _.namespaceURI != "string" || typeof _.insertBefore != "function" || typeof _.hasChildNodes != "function");
  }, hs = function(_) {
    return typeof a == "function" && _ instanceof a;
  };
  function Gt(j, _, P) {
    hi(j, (X) => {
      X.call(t, _, P, Pt);
    });
  }
  const ds = function(_) {
    let P = null;
    if (Gt(Ce.beforeSanitizeElements, _, null), An(_))
      return kt(_), !0;
    const X = Ve(_.nodeName);
    if (Gt(Ce.uponSanitizeElement, _, {
      tagName: X,
      allowedTags: oe
    }), m && _.hasChildNodes() && !hs(_.firstElementChild) && At(/<[/\w!]/g, _.innerHTML) && At(/<[/\w!]/g, _.textContent) || _.nodeType === Cs.progressingInstruction || m && _.nodeType === Cs.comment && At(/<[/\w]/g, _.data))
      return kt(_), !0;
    if (!oe[X] || ot[X]) {
      if (!ot[X] && Yn(X) && (Re.tagNameCheck instanceof RegExp && At(Re.tagNameCheck, X) || Re.tagNameCheck instanceof Function && Re.tagNameCheck(X)))
        return !1;
      if (q && !re[X]) {
        const $e = ge(_) || _.parentNode, ht = ue(_) || _.childNodes;
        if (ht && $e) {
          const Ze = ht.length;
          for (let Ue = Ze - 1; Ue >= 0; --Ue) {
            const xt = G(ht[Ue], !0);
            xt.__removalCount = (_.__removalCount || 0) + 1, $e.insertBefore(xt, ce(_));
          }
        }
      }
      return kt(_), !0;
    }
    return _ instanceof l && !Qs(_) || (X === "noscript" || X === "noembed" || X === "noframes") && At(/<\/no(script|embed|frames)/i, _.innerHTML) ? (kt(_), !0) : (p && _.nodeType === Cs.text && (P = _.textContent, hi([ye, Ye, et], ($e) => {
      P = Ts(P, $e, " ");
    }), _.textContent !== P && (As(t.removed, {
      element: _.cloneNode()
    }), _.textContent = P)), Gt(Ce.afterSanitizeElements, _, null), !1);
  }, Dn = function(_, P, X) {
    if (B && (P === "id" || P === "name") && (X in n || X in Js))
      return !1;
    if (!(_t && !ut[P] && At(rt, P))) {
      if (!(Lt && At(fe, P))) {
        if (!Oe[P] || ut[P]) {
          if (
            // First condition does a very basic check if a) it's basically a valid custom element tagname AND
            // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
            !(Yn(_) && (Re.tagNameCheck instanceof RegExp && At(Re.tagNameCheck, _) || Re.tagNameCheck instanceof Function && Re.tagNameCheck(_)) && (Re.attributeNameCheck instanceof RegExp && At(Re.attributeNameCheck, P) || Re.attributeNameCheck instanceof Function && Re.attributeNameCheck(P)) || // Alternative, second condition checks if it's an `is`-attribute, AND
            // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            P === "is" && Re.allowCustomizedBuiltInElements && (Re.tagNameCheck instanceof RegExp && At(Re.tagNameCheck, X) || Re.tagNameCheck instanceof Function && Re.tagNameCheck(X)))
          ) return !1;
        } else if (!je[P]) {
          if (!At(tt, Ts(X, ae, ""))) {
            if (!((P === "src" || P === "xlink:href" || P === "href") && _ !== "script" && Nd(X, "data:") === 0 && Ae[_])) {
              if (!(W && !At(de, Ts(X, ae, "")))) {
                if (X)
                  return !1;
              }
            }
          }
        }
      }
    }
    return !0;
  }, Yn = function(_) {
    return _ !== "annotation-xml" && Wa(_, Te);
  }, Ft = function(_) {
    Gt(Ce.beforeSanitizeAttributes, _, null);
    const {
      attributes: P
    } = _;
    if (!P || An(_))
      return;
    const X = {
      attrName: "",
      attrValue: "",
      keepAttr: !0,
      allowedAttributes: Oe,
      forceKeepAttr: void 0
    };
    let $e = P.length;
    for (; $e--; ) {
      const ht = P[$e], {
        name: Ze,
        namespaceURI: Ue,
        value: xt
      } = ht, Dt = Ve(Ze), ps = xt;
      let dt = Ze === "value" ? ps : Pd(ps);
      if (X.attrName = Dt, X.attrValue = dt, X.keepAttr = !0, X.forceKeepAttr = void 0, Gt(Ce.uponSanitizeAttribute, _, X), dt = X.attrValue, F && (Dt === "id" || Dt === "name") && (fn(Ze, _), dt = J + dt), m && At(/((--!?|])>)|<\/(style|title)/i, dt)) {
        fn(Ze, _);
        continue;
      }
      if (X.forceKeepAttr)
        continue;
      if (!X.keepAttr) {
        fn(Ze, _);
        continue;
      }
      if (!st && At(/\/>/i, dt)) {
        fn(Ze, _);
        continue;
      }
      p && hi([ye, Ye, et], (ni) => {
        dt = Ts(dt, ni, " ");
      });
      const ti = Ve(_.nodeName);
      if (!Dn(ti, Dt, dt)) {
        fn(Ze, _);
        continue;
      }
      if (T && typeof D == "object" && typeof D.getAttributeType == "function" && !Ue)
        switch (D.getAttributeType(ti, Dt)) {
          case "TrustedHTML": {
            dt = T.createHTML(dt);
            break;
          }
          case "TrustedScriptURL": {
            dt = T.createScriptURL(dt);
            break;
          }
        }
      if (dt !== ps)
        try {
          Ue ? _.setAttributeNS(Ue, Ze, dt) : _.setAttribute(Ze, dt), An(_) ? kt(_) : qa(t.removed);
        } catch {
          fn(Ze, _);
        }
    }
    Gt(Ce.afterSanitizeAttributes, _, null);
  }, Ut = function j(_) {
    let P = null;
    const X = ei(_);
    for (Gt(Ce.beforeSanitizeShadowDOM, _, null); P = X.nextNode(); )
      Gt(Ce.uponSanitizeShadowNode, P, null), ds(P), Ft(P), P.content instanceof r && j(P.content);
    Gt(Ce.afterSanitizeShadowDOM, _, null);
  };
  return t.sanitize = function(j) {
    let _ = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, P = null, X = null, $e = null, ht = null;
    if ($ = !j, $ && (j = "<!-->"), typeof j != "string" && !hs(j))
      if (typeof j.toString == "function") {
        if (j = j.toString(), typeof j != "string")
          throw Ss("dirty is not a string, aborting");
      } else
        throw Ss("toString is not a function");
    if (!t.isSupported)
      return j;
    if (N || Mt(_), t.removed = [], typeof j == "string" && (Z = !1), Z) {
      if (j.nodeName) {
        const xt = Ve(j.nodeName);
        if (!oe[xt] || ot[xt])
          throw Ss("root node is forbidden and cannot be sanitized in-place");
      }
    } else if (j instanceof a)
      P = xn("<!---->"), X = P.ownerDocument.importNode(j, !0), X.nodeType === Cs.element && X.nodeName === "BODY" || X.nodeName === "HTML" ? P = X : P.appendChild(X);
    else {
      if (!I && !p && !v && // eslint-disable-next-line unicorn/prefer-includes
      j.indexOf("<") === -1)
        return T && z ? T.createHTML(j) : j;
      if (P = xn(j), !P)
        return I ? null : z ? L : "";
    }
    P && R && kt(P.firstChild);
    const Ze = ei(Z ? j : P);
    for (; $e = Ze.nextNode(); )
      ds($e), Ft($e), $e.content instanceof r && Ut($e.content);
    if (Z)
      return j;
    if (I) {
      if (U)
        for (ht = xe.call(P.ownerDocument); P.firstChild; )
          ht.appendChild(P.firstChild);
      else
        ht = P;
      return (Oe.shadowroot || Oe.shadowrootmode) && (ht = Ke.call(s, ht, !0)), ht;
    }
    let Ue = v ? P.outerHTML : P.innerHTML;
    return v && oe["!doctype"] && P.ownerDocument && P.ownerDocument.doctype && P.ownerDocument.doctype.name && At(Rc, P.ownerDocument.doctype.name) && (Ue = "<!DOCTYPE " + P.ownerDocument.doctype.name + `>
` + Ue), p && hi([ye, Ye, et], (xt) => {
      Ue = Ts(Ue, xt, " ");
    }), T && z ? T.createHTML(Ue) : Ue;
  }, t.setConfig = function() {
    let j = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    Mt(j), N = !0;
  }, t.clearConfig = function() {
    Pt = null, N = !1;
  }, t.isValidAttribute = function(j, _, P) {
    Pt || Mt({});
    const X = Ve(j), $e = Ve(_);
    return Dn(X, $e, P);
  }, t.addHook = function(j, _) {
    typeof _ == "function" && As(Ce[j], _);
  }, t.removeHook = function(j, _) {
    if (_ !== void 0) {
      const P = Ld(Ce[j], _);
      return P === -1 ? void 0 : Od(Ce[j], P, 1)[0];
    }
    return qa(Ce[j]);
  }, t.removeHooks = function(j) {
    Ce[j] = [];
  }, t.removeAllHooks = function() {
    Ce = Xa();
  }, t;
}
var Lo = Ic();
Lo.addHook("uponSanitizeElement", (e, t) => {
  var i, r, o, a, l;
  if (t.tagName === "svg") {
    (i = e.parentNode) == null || i.removeChild(e);
    return;
  }
  if (t.tagName === "math") {
    (r = e.parentNode) == null || r.removeChild(e);
    return;
  }
  if (t.tagName === "foreignobject") {
    (o = e.parentNode) == null || o.removeChild(e);
    return;
  }
  const n = e, s = (a = t.tagName) == null ? void 0 : a.toUpperCase();
  (s === "IMG" || s === "AREA" || s === "MAP") && ((l = n.parentNode) == null || l.removeChild(n));
});
Lo.addHook("afterSanitizeAttributes", (e) => {
  if (e.hasAttribute("href")) {
    const t = e.getAttribute("href") || "";
    try {
      const n = decodeURIComponent(t.toLowerCase());
      (n.includes("javascript:") || n.includes("data:text/html") || n.includes("vbscript:") || n.includes("about:") || n.includes("file:")) && e.removeAttribute("href");
    } catch {
      (t.toLowerCase().includes("javascript:") || t.toLowerCase().includes("data:text/html") || t.toLowerCase().includes("vbscript:") || t.toLowerCase().includes("about:") || t.toLowerCase().includes("file:")) && e.removeAttribute("href");
    }
  }
  if (e.nodeName === "A") {
    const t = (e.getAttribute("href") || "").trim();
    /^(https?:|mailto:)/i.test(t) ? (e.setAttribute("target", "_blank"), e.setAttribute("rel", "noopener noreferrer nofollow")) : e.removeAttribute("href");
  }
  if (e.hasAttribute("src")) {
    const t = e.getAttribute("src") || "";
    try {
      const n = decodeURIComponent(t.toLowerCase());
      (n.includes("javascript:") || n.includes("data:text/html") || n.includes("vbscript:") || n.includes("about:") || n.includes("file:")) && e.removeAttribute("src");
    } catch {
      (t.toLowerCase().includes("javascript:") || t.toLowerCase().includes("data:text/html") || t.toLowerCase().includes("vbscript:") || t.toLowerCase().includes("about:") || t.toLowerCase().includes("file:")) && e.removeAttribute("src");
    }
  }
  if (e.hasAttribute("style")) {
    const t = e.getAttribute("style") || "";
    try {
      const n = decodeURIComponent(t.toLowerCase());
      (n.includes("expression(") || n.includes("behavior:") || n.includes("-moz-binding") || n.includes("import") || n.includes("javascript:") || n.includes("vbscript:")) && e.removeAttribute("style");
    } catch {
      (t.toLowerCase().includes("expression(") || t.toLowerCase().includes("behavior:") || t.toLowerCase().includes("-moz-binding") || t.toLowerCase().includes("import") || t.toLowerCase().includes("javascript:") || t.toLowerCase().includes("vbscript:")) && e.removeAttribute("style");
    }
  }
  Array.from(e.attributes).forEach((t) => {
    t.name.toLowerCase().startsWith("on") && e.removeAttribute(t.name);
  });
});
function Yd(e) {
  const t = {
    // Block all dangerous tags including SVG, form elements and images.
    // NOTE: 'a' must NOT be in this list — FORBID_TAGS beats ALLOWED_TAGS, and
    // anchors are intentionally kept (markdown links) then hardened by the
    // afterSanitizeAttributes hook (http(s)/mailto only, forced target+rel).
    FORBID_TAGS: [
      "iframe",
      "frame",
      "frameset",
      "object",
      "embed",
      "applet",
      "script",
      "base",
      "link",
      "meta",
      "style",
      "svg",
      "math",
      "form",
      "input",
      "button",
      "textarea",
      "select",
      "option",
      "xml",
      "xss",
      "import",
      "video",
      "audio",
      "track",
      "source",
      "canvas",
      "details",
      "template",
      "slot",
      "noscript",
      "marquee",
      "bgsound",
      "keygen",
      "command",
      "img",
      "area",
      "map"
      // SECURITY: Remove image/map tags completely
    ],
    // Block dangerous attributes
    FORBID_ATTR: [
      // Event handlers
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onmouseout",
      "onmousemove",
      "onkeydown",
      "onkeyup",
      "onkeypress",
      "onfocus",
      "onblur",
      "onchange",
      "onsubmit",
      "ondblclick",
      "oncontextmenu",
      "oninput",
      "oninvalid",
      "onreset",
      "onsearch",
      "onselect",
      "onabort",
      "oncanplay",
      "oncanplaythrough",
      "oncuechange",
      "ondurationchange",
      "onemptied",
      "onended",
      "onloadeddata",
      "onloadedmetadata",
      "onloadstart",
      "onpause",
      "onplay",
      "onplaying",
      "onprogress",
      "onratechange",
      "onseeked",
      "onseeking",
      "onstalled",
      "onsuspend",
      "ontimeupdate",
      "onvolumechange",
      "onwaiting",
      "ontoggle",
      "onauxclick",
      "ongotpointercapture",
      "onlostpointercapture",
      "onpointercancel",
      "onpointerdown",
      "onpointerenter",
      "onpointerleave",
      "onpointermove",
      "onpointerout",
      "onpointerover",
      "onpointerup",
      "onwheel",
      "onanimationcancel",
      "onanimationend",
      "onanimationiteration",
      "onanimationstart",
      "ontransitioncancel",
      "ontransitionend",
      "ontransitionrun",
      "ontransitionstart",
      "ondrag",
      "ondragend",
      "ondragenter",
      "ondragleave",
      "ondragover",
      "ondragstart",
      "ondrop",
      "oncopy",
      "oncut",
      "onpaste",
      "onscroll",
      "onmessage",
      "onmouseenter",
      "onmouseleave",
      "onmousewheel",
      "onbeforeunload",
      "onerrorupdate",
      "onhelp",
      "onmove",
      "onreadystatechange",
      "onresize",
      "onstart",
      "onstop",
      "onunload",
      "onactivate",
      "onafterprint",
      "onafterupdate",
      "onbeforeactivate",
      "onbeforecopy",
      "onbeforecut",
      "onbeforedeactivate",
      "onbeforeeditfocus",
      "onbeforepaste",
      "onbeforeprint",
      "onbeforeupdate",
      "onbounce",
      "oncellchange",
      "oncontrolselect",
      "ondataavailable",
      "ondatasetchanged",
      "ondatasetcomplete",
      "ondeactivate",
      "onfilterchange",
      "onfinish",
      "onfocusin",
      "onfocusout",
      "onlayoutcomplete",
      "onlosecapture",
      "onmoveend",
      "onmovestart",
      "onpropertychange",
      "onresizeend",
      "onresizestart",
      "onrowenter",
      "onrowexit",
      "onrowsdelete",
      "onrowsinserted",
      "onselectionchange",
      "onselectstart",
      "onshow",
      "onsort",
      "onpointerrawupdate",
      // Dangerous attributes
      "formaction",
      "action",
      "form",
      "srcdoc",
      "srcset",
      "dynsrc",
      "lowsrc",
      "ping",
      "poster",
      "background",
      "code",
      "codebase",
      "archive",
      "profile",
      "xmlns",
      "xlink:href",
      "attributename",
      "from",
      "to",
      "values",
      "begin",
      "autofocus",
      "autoplay",
      "controls",
      "manifest",
      "sandbox",
      // SECURITY: block resource-loading attributes. 'href' is intentionally NOT
      // here (FORBID_ATTR beats ALLOWED_ATTR): markdown links need it, and the
      // afterSanitizeAttributes hook strips any href that isn't http(s)/mailto.
      "src",
      "data"
    ],
    // Only allow safe protocols
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // SECURITY: Strip ALL HTML tags to prevent rendering exploits
    // Only allow basic text formatting for markdown (no links, images, or any potentially dangerous tags)
    ALLOWED_TAGS: [
      "a",
      "b",
      "i",
      "u",
      "strong",
      "em",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "span",
      "div",
      "del",
      "hr",
      "sup",
      "sub",
      "abbr",
      "cite",
      "dfn",
      "kbd",
      "mark",
      "q",
      "samp",
      "small",
      "time",
      "var"
    ],
    // Allow safe link attributes only (href is protocol-restricted + target/rel are
    // forced by the afterSanitizeAttributes hook above). No src or resource-loading attrs.
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "title",
      "class",
      "id",
      "align",
      "colspan",
      "rowspan"
    ],
    // Return a string instead of a document
    RETURN_DOM: !1,
    RETURN_DOM_FRAGMENT: !1,
    // Keep HTML comments removed
    ALLOW_DATA_ATTR: !1
    // NOTE: do NOT set USE_PROFILES here — it overrides ALLOWED_TAGS/ALLOWED_ATTR,
    // which would drop the <a> tags we explicitly allow above. The explicit
    // ALLOWED_TAGS/ALLOWED_ATTR allowlist is authoritative; protocols are still
    // restricted by the afterSanitizeAttributes hook (href → http/https/mailto only).
  };
  return Lo.sanitize(e, t);
}
Be.setOptions({
  renderer: new Be.Renderer(),
  gfm: !0,
  breaks: !0
});
const Ai = (e) => Yd(Be(e || "")), Xd = { class: "askai" }, Zd = { class: "askai__bar" }, Jd = ["value", "placeholder", "disabled", "aria-label", "onKeydown"], Qd = ["disabled", "title", "aria-label"], ep = {
  key: 0,
  class: "askai__new-hint"
}, tp = { class: "askai__intro" }, np = { class: "askai__title" }, sp = {
  key: 0,
  class: "askai__subtitle"
}, ip = {
  key: 0,
  class: "askai__suggestions"
}, rp = ["disabled", "onClick"], op = ["aria-live"], ap = {
  key: 0,
  class: "askai__question"
}, lp = {
  key: 1,
  class: "askai__system"
}, cp = ["innerHTML"], up = {
  key: 0,
  class: "askai__sources"
}, fp = ["title"], hp = {
  key: 0,
  class: "askai__thinking",
  role: "status",
  "aria-live": "polite"
}, dp = { class: "askai__thinking-text" }, pp = { class: "askai__foot" }, gp = { key: 0 }, mp = /* @__PURE__ */ $l({
  __name: "AskAiPanel",
  props: {
    messages: {},
    draft: {},
    agentName: {},
    suggestions: {},
    welcomeTitle: {},
    welcomeSubtitle: {},
    placeholder: {},
    inputEnabled: { type: Boolean },
    loading: { type: Boolean },
    showCitations: { type: Boolean },
    disclaimer: {},
    active: { type: Boolean },
    hotkey: { type: Boolean },
    citationLabel: { type: Function },
    citationTooltip: { type: Function },
    displayText: { type: Function },
    isStreaming: { type: Function },
    canStartNewChat: { type: Boolean },
    startingNewChat: { type: Boolean },
    newChatArmed: { type: Boolean }
  },
  emits: ["update:draft", "send", "ask", "close", "newChat", "cancelNewChat"],
  setup(e, { emit: t }) {
    const n = e, s = t, i = ie(null), r = ie(null), o = ie(null), a = ["user", "bot", "agent", "system"], l = le(
      () => n.messages.map((T, L) => ({ message: T, index: L })).filter(({ message: T }) => a.includes(T.message_type))
    ), d = le(() => l.value.length > 0), c = (T) => {
      s("update:draft", T.target.value);
    }, w = () => {
      !n.inputEnabled || !n.draft.trim() || s("send");
    }, k = (T) => {
      n.inputEnabled && s("ask", T);
    }, D = typeof navigator < "u" && /Mac|iPod|iPhone|iPad/.test(navigator.platform || ""), M = (T) => {
      if (T.key === "Escape") {
        T.preventDefault(), s("close");
        return;
      }
      const L = D ? T.metaKey && !T.ctrlKey : T.ctrlKey && !T.metaKey;
      n.hotkey && L && !T.altKey && (T.key === "k" || T.key === "K") && (T.preventDefault(), s("close"));
    }, G = () => {
      os(() => {
        var T;
        return (T = i.value) == null ? void 0 : T.focus();
      });
    };
    let H = 0;
    const ce = () => {
      if (!o.value) return;
      const T = o.value.closest(".askai"), L = r.value;
      if (!T || !L) return;
      const V = T.offsetHeight - L.offsetHeight, K = getComputedStyle(L), xe = parseFloat(K.paddingTop) + parseFloat(K.paddingBottom), Pe = Math.ceil(V + xe + o.value.getBoundingClientRect().height);
      Math.abs(Pe - H) < 3 || (H = Pe, window.parent.postMessage({ type: "WIDGET_RESIZE", height: Pe }, "*"));
    };
    let ue = null;
    const ge = le(
      () => l.value.reduce((T, { message: L, index: V }) => T + n.displayText(V, L.message || "").length, 0)
    );
    return Wt(
      () => [l.value.length, ge.value, n.loading],
      () => os(() => {
        r.value && (r.value.scrollTop = r.value.scrollHeight);
      })
    ), Wt(() => n.active, (T) => {
      T && G();
    }), Yi(() => {
      n.active && G(), window.addEventListener("keydown", M), o.value && typeof ResizeObserver < "u" && (ue = new ResizeObserver(() => ce()), ue.observe(o.value)), ce();
    }), ql(() => {
      window.removeEventListener("keydown", M), ue == null || ue.disconnect(), ue = null;
    }), (T, L) => (x(), A("div", Xd, [
      b("div", Zd, [
        L[5] || (L[5] = b("svg", {
          class: "askai__bar-icon",
          width: "18",
          height: "18",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "1.8",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "aria-hidden": "true"
        }, [
          b("path", { d: "M12 3l1.9 4.9L19 9.8l-4.9 1.9L12 17l-1.9-5.3L5 9.8l5.1-1.9L12 3z" })
        ], -1)),
        b("input", {
          ref_key: "inputEl",
          ref: i,
          type: "text",
          class: "askai__input",
          value: T.draft,
          placeholder: T.placeholder,
          disabled: !T.inputEnabled,
          "aria-label": T.placeholder,
          autocomplete: "off",
          spellcheck: "false",
          onInput: c,
          onKeydown: wi(Wn(w, ["prevent"]), ["enter"])
        }, null, 40, Jd),
        T.canStartNewChat ? (x(), A("button", {
          key: 0,
          type: "button",
          class: Fe(["askai__new", { "askai__new--armed": T.newChatArmed }]),
          disabled: T.startingNewChat,
          title: T.newChatArmed ? "This ends the current chat — click again to confirm" : "Start a new chat",
          "aria-label": T.newChatArmed ? "Confirm starting a new chat" : "Start a new chat",
          onClick: L[0] || (L[0] = (V) => s("newChat")),
          onBlur: L[1] || (L[1] = (V) => s("cancelNewChat"))
        }, [
          L[3] || (L[3] = b("svg", {
            width: "15",
            height: "15",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "aria-hidden": "true"
          }, [
            b("path", { d: "M12 20h9" }),
            b("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" })
          ], -1)),
          T.newChatArmed ? (x(), A("span", ep, "Click again to confirm")) : se("", !0)
        ], 42, Qd)) : se("", !0),
        b("button", {
          type: "button",
          class: "askai__close",
          "aria-label": "Close",
          title: "Close (Esc)",
          onClick: L[2] || (L[2] = (V) => s("close"))
        }, L[4] || (L[4] = [
          b("span", { class: "askai__kbd" }, "Esc", -1)
        ]))
      ]),
      b("div", {
        ref_key: "bodyEl",
        ref: r,
        class: "askai__body"
      }, [
        b("div", {
          ref_key: "contentEl",
          ref: o,
          class: "askai__content"
        }, [
          d.value ? (x(), A(De, { key: 1 }, [
            (x(!0), A(De, null, gt(l.value, ({ message: V, index: K }) => (x(), A("div", {
              key: K,
              class: "askai__turn",
              "aria-live": T.isStreaming(K) ? "off" : "polite"
            }, [
              V.message_type === "user" ? (x(), A("p", ap, Q(V.message), 1)) : V.message_type === "system" ? (x(), A("p", lp, Q(V.message), 1)) : (x(), A(De, { key: 2 }, [
                b("div", {
                  class: Fe(["askai__answer", { "askai__answer--streaming": T.isStreaming(K) }]),
                  innerHTML: E(Ai)(T.isStreaming(K) ? T.displayText(K, V.message || "") : V.message || "")
                }, null, 10, cp),
                T.showCitations && !T.isStreaming(K) && V.sources && V.sources.length ? (x(), A("div", up, [
                  L[8] || (L[8] = b("span", { class: "askai__label" }, "Sources", -1)),
                  (x(!0), A(De, null, gt(V.sources, (xe, Pe) => (x(), A("span", {
                    key: Pe,
                    class: "askai__source",
                    title: T.citationTooltip(xe)
                  }, Q(T.citationLabel(xe)), 9, fp))), 128))
                ])) : se("", !0)
              ], 64))
            ], 8, op))), 128)),
            T.loading ? (x(), A("div", hp, [
              L[9] || (L[9] = b("span", { class: "askai__dot" }, null, -1)),
              L[10] || (L[10] = b("span", { class: "askai__dot" }, null, -1)),
              L[11] || (L[11] = b("span", { class: "askai__dot" }, null, -1)),
              b("span", dp, Q(T.showCitations ? "Searching the knowledge base" : "Thinking"), 1)
            ])) : se("", !0)
          ], 64)) : (x(), A(De, { key: 0 }, [
            b("div", tp, [
              b("h2", np, Q(T.welcomeTitle || `Ask ${T.agentName}`), 1),
              T.welcomeSubtitle ? (x(), A("p", sp, Q(T.welcomeSubtitle), 1)) : se("", !0)
            ]),
            T.suggestions.length && !T.draft.trim() ? (x(), A("div", ip, [
              L[7] || (L[7] = b("p", { class: "askai__label" }, "Suggested", -1)),
              (x(!0), A(De, null, gt(T.suggestions, (V) => (x(), A("button", {
                key: V,
                type: "button",
                class: "askai__suggestion",
                disabled: !T.inputEnabled,
                onClick: (K) => k(V)
              }, [
                b("span", null, Q(V), 1),
                L[6] || (L[6] = b("svg", {
                  width: "15",
                  height: "15",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "aria-hidden": "true"
                }, [
                  b("path", { d: "M5 12h14M13 6l6 6-6 6" })
                ], -1))
              ], 8, rp))), 128))
            ])) : se("", !0)
          ], 64))
        ], 512)
      ], 512),
      b("div", pp, [
        T.disclaimer ? (x(), A("span", gp, Q(T.disclaimer), 1)) : se("", !0),
        L[12] || (L[12] = b("a", {
          class: "askai__brand",
          href: "https://chattermate.chat",
          target: "_blank",
          rel: "noopener noreferrer"
        }, "Powered by ChatterMate", -1))
      ])
    ]));
  }
}), Lc = (e, t) => {
  const n = e.__vccOpts || e;
  for (const [s, i] of t)
    n[s] = i;
  return n;
}, _p = /* @__PURE__ */ Lc(mp, [["__scopeId", "data-v-93559d14"]]), Os = [
  { stops: "#9D8CFF, #5FE3D6, #C9F24E", glow: "rgba(157,140,255,0.45)" },
  // aurora (default)
  { stops: "#FF8A73, #9D8CFF, #5FE3D6", glow: "rgba(255,138,115,0.40)" },
  // coral
  { stops: "#5FE3D6, #C9F24E, #9D8CFF", glow: "rgba(95,227,214,0.40)" },
  // teal
  { stops: "#C9F24E, #5FE3D6, #FF8A73", glow: "rgba(201,242,78,0.35)" },
  // lime
  { stops: "#6EA8FF, #9D8CFF, #5FE3D6", glow: "rgba(110,168,255,0.42)" },
  // blue
  { stops: "#FF7AC6, #9D8CFF, #6EA8FF", glow: "rgba(255,122,198,0.42)" },
  // pink
  { stops: "#FF8A73, #FFC857, #FF7AC6", glow: "rgba(255,200,87,0.40)" },
  // sunset
  { stops: "#7C5CFF, #B388FF, #5FE3D6", glow: "rgba(124,92,255,0.45)" },
  // violet
  { stops: "#0EA5A5, #5FE3D6, #C9F24E", glow: "rgba(14,165,165,0.40)" },
  // emerald
  { stops: "#F34611, #FF8A73, #FFC857", glow: "rgba(243,70,17,0.38)" }
  // ember
], yp = (e) => (e || "").split("").reduce((t, n) => t + n.charCodeAt(0), 0) % Os.length, vp = (e) => {
  const t = Os[(e % Os.length + Os.length) % Os.length];
  return {
    background: `
            radial-gradient(circle at 32% 28%, rgba(255,255,255,0.22) 0%, transparent 42%),
            radial-gradient(circle at 68% 72%, rgba(0,0,0,0.25) 0%, transparent 38%),
            radial-gradient(ellipse at 50% 50%, ${t.stops})
        `.trim(),
    boxShadow: `0 4px 28px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
    borderRadius: "50%"
  };
}, bp = (e, t) => {
  const n = typeof t == "number" && Number.isFinite(t) ? t : yp(e);
  return vp(n);
}, Za = (e) => {
  var t;
  return !!((t = e == null ? void 0 : e.attributes) != null && t.end_chat);
}, Ja = "AI can make mistakes. Check important info.";
function wp(e, t = !1) {
  return e !== !1 && !t;
}
const Ir = {
  ai: "Online · replies instantly",
  human: "Online · usually replies in a few minutes",
  away: "Away · we'll reply when we're back"
};
function kp(e, t = !1) {
  return (t ? "human" : (e == null ? void 0 : e.mode) ?? "ai") === "ai" ? { text: Ir.ai, online: !0 } : (e == null ? void 0 : e.available) !== !1 ? { text: Ir.human, online: !0 } : { text: Ir.away, online: !1 };
}
const Oc = (e) => !!e && (/^https?:\/\//i.test(e) || e.startsWith("data:")), xp = (e, t) => e ? Oc(e) || e.startsWith("blob:") ? e : `${t.replace(/\/api\/v1\/?$/, "")}${e.startsWith("/") ? "" : "/"}${e}` : "";
function Qa() {
  return typeof window < "u" && window.APP_CONFIG ? window.APP_CONFIG : {};
}
const Ks = {
  get API_URL() {
    return Qa().API_URL || "https://api.chattermate.chat/api/v1";
  },
  get WS_URL() {
    return Qa().WS_URL || "wss://api.chattermate.chat";
  }
};
function Ui(e) {
  return xp(e, Ks.API_URL);
}
function Ap(e) {
  const t = le(() => ({
    backgroundColor: "var(--cm-card)",
    color: "var(--cm-text)"
  })), n = le(() => ({
    backgroundColor: e.value.chat_bubble_color || "#C9F24E",
    color: ls(e.value.chat_bubble_color || "#C9F24E") ? "#FFFFFF" : "#000000"
  })), s = le(() => ({
    backgroundColor: "var(--cm-agent-bg)",
    color: "var(--cm-text)"
  })), i = le(() => ({
    backgroundColor: "var(--cm-accent)",
    color: "var(--cm-on-accent)"
  })), r = le(() => ({
    color: "var(--cm-text)"
  })), o = le(() => ({
    borderBottom: "1px solid var(--cm-hairline)"
  })), a = le(() => Ui(e.value.photo_url)), l = le(() => {
    const d = e.value.chat_background_color || "#ffffff";
    return {
      boxShadow: `0 8px 5px ${ls(d) ? "rgba(0, 0, 0, 0.24)" : "rgba(0, 0, 0, 0.12)"}`
    };
  });
  return {
    chatStyles: t,
    chatIconStyles: n,
    agentBubbleStyles: s,
    userBubbleStyles: i,
    messageNameStyles: r,
    headerBorderStyles: o,
    photoUrl: a,
    shadowStyle: l
  };
}
const Tp = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]), Sp = /* @__PURE__ */ new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);
[...Tp, ...Sp];
function Ep(e, t) {
  const n = ie([]), s = ie(!1), i = ie(null), r = (L) => {
    if (L === 0) return "0 Bytes";
    const V = 1024, K = ["Bytes", "KB", "MB", "GB"], xe = Math.floor(Math.log(L) / Math.log(V));
    return parseFloat((L / Math.pow(V, xe)).toFixed(2)) + " " + K[xe];
  }, o = (L) => L.startsWith("image/"), a = (L) => L ? Ui(L) : "", l = (L) => {
    const V = L.file_url || L.url;
    return V ? Ui(V) : "";
  }, d = async (L) => {
    const V = L.target;
    V.files && V.files.length > 0 && (await G(Array.from(V.files)), V.value = "");
  }, c = async (L) => {
    var K;
    L.preventDefault();
    const V = (K = L.dataTransfer) == null ? void 0 : K.files;
    V && V.length > 0 && await G(Array.from(V));
  }, w = (L) => {
    L.preventDefault();
  }, k = (L) => {
    L.preventDefault();
  }, D = async (L) => {
    var xe;
    const V = (xe = L.clipboardData) == null ? void 0 : xe.items;
    if (!V) return;
    const K = [];
    for (const Pe of Array.from(V))
      if (Pe.kind === "file") {
        const Ke = Pe.getAsFile();
        Ke && K.push(Ke);
      }
    K.length > 0 && await G(K);
  }, M = async (L, V = 500) => new Promise((K, xe) => {
    const Pe = new FileReader();
    Pe.onload = (Ke) => {
      var ye;
      const Ce = new Image();
      Ce.onload = () => {
        const Ye = document.createElement("canvas");
        let et = Ce.width, rt = Ce.height;
        const fe = 1920;
        (et > fe || rt > fe) && (et > rt ? (rt = rt / et * fe, et = fe) : (et = et / rt * fe, rt = fe)), Ye.width = et, Ye.height = rt;
        const de = Ye.getContext("2d");
        if (!de) {
          xe(new Error("Failed to get canvas context"));
          return;
        }
        de.drawImage(Ce, 0, 0, et, rt);
        let ae = 0.9;
        const Te = () => {
          Ye.toBlob((tt) => {
            if (!tt) {
              xe(new Error("Failed to compress image"));
              return;
            }
            if (tt.size / 1024 > V && ae > 0.3)
              ae -= 0.1, Te();
            else {
              const Le = new FileReader();
              Le.onload = () => {
                const Oe = Le.result.split(",")[1];
                K({ blob: tt, base64: Oe });
              }, Le.readAsDataURL(tt);
            }
          }, L.type === "image/png" ? "image/png" : "image/jpeg", ae);
        };
        Te();
      }, Ce.onerror = () => xe(new Error("Failed to load image")), Ce.src = (ye = Ke.target) == null ? void 0 : ye.result;
    }, Pe.onerror = () => xe(new Error("Failed to read file")), Pe.readAsDataURL(L);
  }), G = async (L) => {
    if (n.value.length >= 3) {
      alert("Maximum 3 files allowed per message");
      return;
    }
    const Ke = 3 - n.value.length, Ce = L.slice(0, Ke);
    L.length > Ke && alert(`Only ${Ke} more file(s) can be uploaded. Maximum 3 files per message.`);
    for (const ye of Ce)
      try {
        if (n.value.some((fe) => fe.filename === ye.name)) {
          console.warn(`File ${ye.name} is already selected`), alert(`File "${ye.name}" is already selected`);
          continue;
        }
        const et = ye.type.startsWith("image/"), rt = et ? 5242880 : 10485760;
        if (ye.size > rt) {
          const fe = rt / 1048576;
          console.error(`File ${ye.name} is too large. Maximum size is ${fe}MB`), alert(`File "${ye.name}" is too large. Maximum size for ${et ? "images" : "documents"} is ${fe}MB`);
          continue;
        }
        if (et)
          try {
            const { blob: fe, base64: de } = await M(ye, 500), ae = fe.size;
            console.log(`Compressed ${ye.name}: ${(ye.size / 1024).toFixed(2)}KB → ${(ae / 1024).toFixed(2)}KB`), n.value.push({
              content: de,
              filename: ye.name,
              type: ye.type,
              size: ae,
              url: URL.createObjectURL(fe),
              file_url: URL.createObjectURL(fe)
            });
          } catch (fe) {
            console.error("Image compression failed, uploading original:", fe);
            const de = new FileReader();
            de.onload = (ae) => {
              var oe;
              const tt = ((oe = ae.target) == null ? void 0 : oe.result).split(",")[1];
              n.value.push({
                content: tt,
                filename: ye.name,
                type: ye.type,
                size: ye.size,
                url: URL.createObjectURL(ye),
                file_url: URL.createObjectURL(ye)
              });
            }, de.readAsDataURL(ye);
          }
        else {
          const fe = new FileReader();
          fe.onload = (de) => {
            var tt;
            const Te = ((tt = de.target) == null ? void 0 : tt.result).split(",")[1];
            n.value.push({
              content: Te,
              filename: ye.name,
              type: ye.type || "application/octet-stream",
              size: ye.size,
              url: "",
              file_url: ""
            });
          }, fe.readAsDataURL(ye);
        }
      } catch (Ye) {
        console.error("File upload error:", Ye);
      }
  };
  return {
    uploadedAttachments: n,
    previewModal: s,
    previewFile: i,
    formatFileSize: r,
    isImageAttachment: o,
    getDownloadUrl: a,
    getPreviewUrl: l,
    handleFileSelect: d,
    handleDrop: c,
    handleDragOver: w,
    handleDragLeave: k,
    handlePaste: D,
    uploadFiles: G,
    removeAttachment: async (L) => {
      const V = n.value[L];
      if (V) {
        try {
          let K = V.url;
          if (K.startsWith("/uploads/") ? K = K.substring(9) : K.startsWith("/") && (K = K.substring(1)), Oc(K))
            try {
              K = new URL(K).pathname.replace(/^\/+/, "");
            } catch {
            }
          const xe = {};
          e.value && (xe.Authorization = `Bearer ${e.value}`);
          const Pe = await fetch(`${Ks.API_URL}/files/upload/${K}`, {
            method: "DELETE",
            headers: xe
          });
          if (Pe.ok)
            console.log("File deleted successfully from backend.");
          else {
            const Ke = await Pe.json();
            console.error("Failed to delete file:", Ke.detail);
          }
        } catch (K) {
          console.error("Error calling delete API:", K);
        }
        V.url && V.url.startsWith("blob:") && URL.revokeObjectURL(V.url), V.file_url && V.file_url.startsWith("blob:") && URL.revokeObjectURL(V.file_url), n.value.splice(L, 1);
      }
    },
    openPreview: (L) => {
      i.value = L, s.value = !0;
    },
    closePreview: () => {
      s.value = !1, setTimeout(() => {
        i.value = null;
      }, 300);
    },
    openFilePicker: () => {
      var L;
      (L = t.value) == null || L.click();
    },
    isImage: (L) => L.startsWith("image/")
  };
}
const un = /* @__PURE__ */ Object.create(null);
un.open = "0";
un.close = "1";
un.ping = "2";
un.pong = "3";
un.message = "4";
un.upgrade = "5";
un.noop = "6";
const Ti = /* @__PURE__ */ Object.create(null);
Object.keys(un).forEach((e) => {
  Ti[un[e]] = e;
});
const Qr = { type: "error", data: "parser error" }, Nc = typeof Blob == "function" || typeof Blob < "u" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]", Pc = typeof ArrayBuffer == "function", Mc = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e && e.buffer instanceof ArrayBuffer, Oo = ({ type: e, data: t }, n, s) => Nc && t instanceof Blob ? n ? s(t) : el(t, s) : Pc && (t instanceof ArrayBuffer || Mc(t)) ? n ? s(t) : el(new Blob([t]), s) : s(un[e] + (t || "")), el = (e, t) => {
  const n = new FileReader();
  return n.onload = function() {
    const s = n.result.split(",")[1];
    t("b" + (s || ""));
  }, n.readAsDataURL(e);
};
function tl(e) {
  return e instanceof Uint8Array ? e : e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
}
let Lr;
function Cp(e, t) {
  if (Nc && e.data instanceof Blob)
    return e.data.arrayBuffer().then(tl).then(t);
  if (Pc && (e.data instanceof ArrayBuffer || Mc(e.data)))
    return t(tl(e.data));
  Oo(e, !1, (n) => {
    Lr || (Lr = new TextEncoder()), t(Lr.encode(n));
  });
}
const nl = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", Ns = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (let e = 0; e < nl.length; e++)
  Ns[nl.charCodeAt(e)] = e;
const Rp = (e) => {
  let t = e.length * 0.75, n = e.length, s, i = 0, r, o, a, l;
  e[e.length - 1] === "=" && (t--, e[e.length - 2] === "=" && t--);
  const d = new ArrayBuffer(t), c = new Uint8Array(d);
  for (s = 0; s < n; s += 4)
    r = Ns[e.charCodeAt(s)], o = Ns[e.charCodeAt(s + 1)], a = Ns[e.charCodeAt(s + 2)], l = Ns[e.charCodeAt(s + 3)], c[i++] = r << 2 | o >> 4, c[i++] = (o & 15) << 4 | a >> 2, c[i++] = (a & 3) << 6 | l & 63;
  return d;
}, Ip = typeof ArrayBuffer == "function", No = (e, t) => {
  if (typeof e != "string")
    return {
      type: "message",
      data: Fc(e, t)
    };
  const n = e.charAt(0);
  return n === "b" ? {
    type: "message",
    data: Lp(e.substring(1), t)
  } : Ti[n] ? e.length > 1 ? {
    type: Ti[n],
    data: e.substring(1)
  } : {
    type: Ti[n]
  } : Qr;
}, Lp = (e, t) => {
  if (Ip) {
    const n = Rp(e);
    return Fc(n, t);
  } else
    return { base64: !0, data: e };
}, Fc = (e, t) => {
  switch (t) {
    case "blob":
      return e instanceof Blob ? e : new Blob([e]);
    case "arraybuffer":
    default:
      return e instanceof ArrayBuffer ? e : e.buffer;
  }
}, Dc = "", Op = (e, t) => {
  const n = e.length, s = new Array(n);
  let i = 0;
  e.forEach((r, o) => {
    Oo(r, !1, (a) => {
      s[o] = a, ++i === n && t(s.join(Dc));
    });
  });
}, Np = (e, t) => {
  const n = e.split(Dc), s = [];
  for (let i = 0; i < n.length; i++) {
    const r = No(n[i], t);
    if (s.push(r), r.type === "error")
      break;
  }
  return s;
};
function Pp() {
  return new TransformStream({
    transform(e, t) {
      Cp(e, (n) => {
        const s = n.length;
        let i;
        if (s < 126)
          i = new Uint8Array(1), new DataView(i.buffer).setUint8(0, s);
        else if (s < 65536) {
          i = new Uint8Array(3);
          const r = new DataView(i.buffer);
          r.setUint8(0, 126), r.setUint16(1, s);
        } else {
          i = new Uint8Array(9);
          const r = new DataView(i.buffer);
          r.setUint8(0, 127), r.setBigUint64(1, BigInt(s));
        }
        e.data && typeof e.data != "string" && (i[0] |= 128), t.enqueue(i), t.enqueue(n);
      });
    }
  });
}
let Or;
function pi(e) {
  return e.reduce((t, n) => t + n.length, 0);
}
function gi(e, t) {
  if (e[0].length === t)
    return e.shift();
  const n = new Uint8Array(t);
  let s = 0;
  for (let i = 0; i < t; i++)
    n[i] = e[0][s++], s === e[0].length && (e.shift(), s = 0);
  return e.length && s < e[0].length && (e[0] = e[0].slice(s)), n;
}
function Mp(e, t) {
  Or || (Or = new TextDecoder());
  const n = [];
  let s = 0, i = -1, r = !1;
  return new TransformStream({
    transform(o, a) {
      for (n.push(o); ; ) {
        if (s === 0) {
          if (pi(n) < 1)
            break;
          const l = gi(n, 1);
          r = (l[0] & 128) === 128, i = l[0] & 127, i < 126 ? s = 3 : i === 126 ? s = 1 : s = 2;
        } else if (s === 1) {
          if (pi(n) < 2)
            break;
          const l = gi(n, 2);
          i = new DataView(l.buffer, l.byteOffset, l.length).getUint16(0), s = 3;
        } else if (s === 2) {
          if (pi(n) < 8)
            break;
          const l = gi(n, 8), d = new DataView(l.buffer, l.byteOffset, l.length), c = d.getUint32(0);
          if (c > Math.pow(2, 21) - 1) {
            a.enqueue(Qr);
            break;
          }
          i = c * Math.pow(2, 32) + d.getUint32(4), s = 3;
        } else {
          if (pi(n) < i)
            break;
          const l = gi(n, i);
          a.enqueue(No(r ? l : Or.decode(l), t)), s = 0;
        }
        if (i === 0 || i > e) {
          a.enqueue(Qr);
          break;
        }
      }
    }
  });
}
const Bc = 4;
function lt(e) {
  if (e) return Fp(e);
}
function Fp(e) {
  for (var t in lt.prototype)
    e[t] = lt.prototype[t];
  return e;
}
lt.prototype.on = lt.prototype.addEventListener = function(e, t) {
  return this._callbacks = this._callbacks || {}, (this._callbacks["$" + e] = this._callbacks["$" + e] || []).push(t), this;
};
lt.prototype.once = function(e, t) {
  function n() {
    this.off(e, n), t.apply(this, arguments);
  }
  return n.fn = t, this.on(e, n), this;
};
lt.prototype.off = lt.prototype.removeListener = lt.prototype.removeAllListeners = lt.prototype.removeEventListener = function(e, t) {
  if (this._callbacks = this._callbacks || {}, arguments.length == 0)
    return this._callbacks = {}, this;
  var n = this._callbacks["$" + e];
  if (!n) return this;
  if (arguments.length == 1)
    return delete this._callbacks["$" + e], this;
  for (var s, i = 0; i < n.length; i++)
    if (s = n[i], s === t || s.fn === t) {
      n.splice(i, 1);
      break;
    }
  return n.length === 0 && delete this._callbacks["$" + e], this;
};
lt.prototype.emit = function(e) {
  this._callbacks = this._callbacks || {};
  for (var t = new Array(arguments.length - 1), n = this._callbacks["$" + e], s = 1; s < arguments.length; s++)
    t[s - 1] = arguments[s];
  if (n) {
    n = n.slice(0);
    for (var s = 0, i = n.length; s < i; ++s)
      n[s].apply(this, t);
  }
  return this;
};
lt.prototype.emitReserved = lt.prototype.emit;
lt.prototype.listeners = function(e) {
  return this._callbacks = this._callbacks || {}, this._callbacks["$" + e] || [];
};
lt.prototype.hasListeners = function(e) {
  return !!this.listeners(e).length;
};
const tr = typeof Promise == "function" && typeof Promise.resolve == "function" ? (t) => Promise.resolve().then(t) : (t, n) => n(t, 0), Ht = typeof self < "u" ? self : typeof window < "u" ? window : Function("return this")(), Dp = "arraybuffer";
function $c(e, ...t) {
  return t.reduce((n, s) => (e.hasOwnProperty(s) && (n[s] = e[s]), n), {});
}
const Bp = Ht.setTimeout, $p = Ht.clearTimeout;
function nr(e, t) {
  t.useNativeTimers ? (e.setTimeoutFn = Bp.bind(Ht), e.clearTimeoutFn = $p.bind(Ht)) : (e.setTimeoutFn = Ht.setTimeout.bind(Ht), e.clearTimeoutFn = Ht.clearTimeout.bind(Ht));
}
const Up = 1.33;
function zp(e) {
  return typeof e == "string" ? Hp(e) : Math.ceil((e.byteLength || e.size) * Up);
}
function Hp(e) {
  let t = 0, n = 0;
  for (let s = 0, i = e.length; s < i; s++)
    t = e.charCodeAt(s), t < 128 ? n += 1 : t < 2048 ? n += 2 : t < 55296 || t >= 57344 ? n += 3 : (s++, n += 4);
  return n;
}
function Uc() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
function qp(e) {
  let t = "";
  for (let n in e)
    e.hasOwnProperty(n) && (t.length && (t += "&"), t += encodeURIComponent(n) + "=" + encodeURIComponent(e[n]));
  return t;
}
function Wp(e) {
  let t = {}, n = e.split("&");
  for (let s = 0, i = n.length; s < i; s++) {
    let r = n[s].split("=");
    t[decodeURIComponent(r[0])] = decodeURIComponent(r[1]);
  }
  return t;
}
class jp extends Error {
  constructor(t, n, s) {
    super(t), this.description = n, this.context = s, this.type = "TransportError";
  }
}
class Po extends lt {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} opts - options
   * @protected
   */
  constructor(t) {
    super(), this.writable = !1, nr(this, t), this.opts = t, this.query = t.query, this.socket = t.socket, this.supportsBinary = !t.forceBase64;
  }
  /**
   * Emits an error.
   *
   * @param {String} reason
   * @param description
   * @param context - the error context
   * @return {Transport} for chaining
   * @protected
   */
  onError(t, n, s) {
    return super.emitReserved("error", new jp(t, n, s)), this;
  }
  /**
   * Opens the transport.
   */
  open() {
    return this.readyState = "opening", this.doOpen(), this;
  }
  /**
   * Closes the transport.
   */
  close() {
    return (this.readyState === "opening" || this.readyState === "open") && (this.doClose(), this.onClose()), this;
  }
  /**
   * Sends multiple packets.
   *
   * @param {Array} packets
   */
  send(t) {
    this.readyState === "open" && this.write(t);
  }
  /**
   * Called upon open
   *
   * @protected
   */
  onOpen() {
    this.readyState = "open", this.writable = !0, super.emitReserved("open");
  }
  /**
   * Called with data.
   *
   * @param {String} data
   * @protected
   */
  onData(t) {
    const n = No(t, this.socket.binaryType);
    this.onPacket(n);
  }
  /**
   * Called with a decoded packet.
   *
   * @protected
   */
  onPacket(t) {
    super.emitReserved("packet", t);
  }
  /**
   * Called upon close.
   *
   * @protected
   */
  onClose(t) {
    this.readyState = "closed", super.emitReserved("close", t);
  }
  /**
   * Pauses the transport, in order not to lose packets during an upgrade.
   *
   * @param onPause
   */
  pause(t) {
  }
  createUri(t, n = {}) {
    return t + "://" + this._hostname() + this._port() + this.opts.path + this._query(n);
  }
  _hostname() {
    const t = this.opts.hostname;
    return t.indexOf(":") === -1 ? t : "[" + t + "]";
  }
  _port() {
    return this.opts.port && (this.opts.secure && +(this.opts.port !== 443) || !this.opts.secure && Number(this.opts.port) !== 80) ? ":" + this.opts.port : "";
  }
  _query(t) {
    const n = qp(t);
    return n.length ? "?" + n : "";
  }
}
class Vp extends Po {
  constructor() {
    super(...arguments), this._polling = !1;
  }
  get name() {
    return "polling";
  }
  /**
   * Opens the socket (triggers polling). We write a PING message to determine
   * when the transport is open.
   *
   * @protected
   */
  doOpen() {
    this._poll();
  }
  /**
   * Pauses polling.
   *
   * @param {Function} onPause - callback upon buffers are flushed and transport is paused
   * @package
   */
  pause(t) {
    this.readyState = "pausing";
    const n = () => {
      this.readyState = "paused", t();
    };
    if (this._polling || !this.writable) {
      let s = 0;
      this._polling && (s++, this.once("pollComplete", function() {
        --s || n();
      })), this.writable || (s++, this.once("drain", function() {
        --s || n();
      }));
    } else
      n();
  }
  /**
   * Starts polling cycle.
   *
   * @private
   */
  _poll() {
    this._polling = !0, this.doPoll(), this.emitReserved("poll");
  }
  /**
   * Overloads onData to detect payloads.
   *
   * @protected
   */
  onData(t) {
    const n = (s) => {
      if (this.readyState === "opening" && s.type === "open" && this.onOpen(), s.type === "close")
        return this.onClose({ description: "transport closed by the server" }), !1;
      this.onPacket(s);
    };
    Np(t, this.socket.binaryType).forEach(n), this.readyState !== "closed" && (this._polling = !1, this.emitReserved("pollComplete"), this.readyState === "open" && this._poll());
  }
  /**
   * For polling, send a close packet.
   *
   * @protected
   */
  doClose() {
    const t = () => {
      this.write([{ type: "close" }]);
    };
    this.readyState === "open" ? t() : this.once("open", t);
  }
  /**
   * Writes a packets payload.
   *
   * @param {Array} packets - data packets
   * @protected
   */
  write(t) {
    this.writable = !1, Op(t, (n) => {
      this.doWrite(n, () => {
        this.writable = !0, this.emitReserved("drain");
      });
    });
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const t = this.opts.secure ? "https" : "http", n = this.query || {};
    return this.opts.timestampRequests !== !1 && (n[this.opts.timestampParam] = Uc()), !this.supportsBinary && !n.sid && (n.b64 = 1), this.createUri(t, n);
  }
}
let zc = !1;
try {
  zc = typeof XMLHttpRequest < "u" && "withCredentials" in new XMLHttpRequest();
} catch {
}
const Kp = zc;
function Gp() {
}
class Yp extends Vp {
  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @package
   */
  constructor(t) {
    if (super(t), typeof location < "u") {
      const n = location.protocol === "https:";
      let s = location.port;
      s || (s = n ? "443" : "80"), this.xd = typeof location < "u" && t.hostname !== location.hostname || s !== t.port;
    }
  }
  /**
   * Sends data.
   *
   * @param {String} data to send.
   * @param {Function} called upon flush.
   * @private
   */
  doWrite(t, n) {
    const s = this.request({
      method: "POST",
      data: t
    });
    s.on("success", n), s.on("error", (i, r) => {
      this.onError("xhr post error", i, r);
    });
  }
  /**
   * Starts a poll cycle.
   *
   * @private
   */
  doPoll() {
    const t = this.request();
    t.on("data", this.onData.bind(this)), t.on("error", (n, s) => {
      this.onError("xhr poll error", n, s);
    }), this.pollXhr = t;
  }
}
class ln extends lt {
  /**
   * Request constructor
   *
   * @param {Object} options
   * @package
   */
  constructor(t, n, s) {
    super(), this.createRequest = t, nr(this, s), this._opts = s, this._method = s.method || "GET", this._uri = n, this._data = s.data !== void 0 ? s.data : null, this._create();
  }
  /**
   * Creates the XHR object and sends the request.
   *
   * @private
   */
  _create() {
    var t;
    const n = $c(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
    n.xdomain = !!this._opts.xd;
    const s = this._xhr = this.createRequest(n);
    try {
      s.open(this._method, this._uri, !0);
      try {
        if (this._opts.extraHeaders) {
          s.setDisableHeaderCheck && s.setDisableHeaderCheck(!0);
          for (let i in this._opts.extraHeaders)
            this._opts.extraHeaders.hasOwnProperty(i) && s.setRequestHeader(i, this._opts.extraHeaders[i]);
        }
      } catch {
      }
      if (this._method === "POST")
        try {
          s.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch {
        }
      try {
        s.setRequestHeader("Accept", "*/*");
      } catch {
      }
      (t = this._opts.cookieJar) === null || t === void 0 || t.addCookies(s), "withCredentials" in s && (s.withCredentials = this._opts.withCredentials), this._opts.requestTimeout && (s.timeout = this._opts.requestTimeout), s.onreadystatechange = () => {
        var i;
        s.readyState === 3 && ((i = this._opts.cookieJar) === null || i === void 0 || i.parseCookies(
          // @ts-ignore
          s.getResponseHeader("set-cookie")
        )), s.readyState === 4 && (s.status === 200 || s.status === 1223 ? this._onLoad() : this.setTimeoutFn(() => {
          this._onError(typeof s.status == "number" ? s.status : 0);
        }, 0));
      }, s.send(this._data);
    } catch (i) {
      this.setTimeoutFn(() => {
        this._onError(i);
      }, 0);
      return;
    }
    typeof document < "u" && (this._index = ln.requestsCount++, ln.requests[this._index] = this);
  }
  /**
   * Called upon error.
   *
   * @private
   */
  _onError(t) {
    this.emitReserved("error", t, this._xhr), this._cleanup(!0);
  }
  /**
   * Cleans up house.
   *
   * @private
   */
  _cleanup(t) {
    if (!(typeof this._xhr > "u" || this._xhr === null)) {
      if (this._xhr.onreadystatechange = Gp, t)
        try {
          this._xhr.abort();
        } catch {
        }
      typeof document < "u" && delete ln.requests[this._index], this._xhr = null;
    }
  }
  /**
   * Called upon load.
   *
   * @private
   */
  _onLoad() {
    const t = this._xhr.responseText;
    t !== null && (this.emitReserved("data", t), this.emitReserved("success"), this._cleanup());
  }
  /**
   * Aborts the request.
   *
   * @package
   */
  abort() {
    this._cleanup();
  }
}
ln.requestsCount = 0;
ln.requests = {};
if (typeof document < "u") {
  if (typeof attachEvent == "function")
    attachEvent("onunload", sl);
  else if (typeof addEventListener == "function") {
    const e = "onpagehide" in Ht ? "pagehide" : "unload";
    addEventListener(e, sl, !1);
  }
}
function sl() {
  for (let e in ln.requests)
    ln.requests.hasOwnProperty(e) && ln.requests[e].abort();
}
const Xp = function() {
  const e = Hc({
    xdomain: !1
  });
  return e && e.responseType !== null;
}();
class Zp extends Yp {
  constructor(t) {
    super(t);
    const n = t && t.forceBase64;
    this.supportsBinary = Xp && !n;
  }
  request(t = {}) {
    return Object.assign(t, { xd: this.xd }, this.opts), new ln(Hc, this.uri(), t);
  }
}
function Hc(e) {
  const t = e.xdomain;
  try {
    if (typeof XMLHttpRequest < "u" && (!t || Kp))
      return new XMLHttpRequest();
  } catch {
  }
  if (!t)
    try {
      return new Ht[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch {
    }
}
const qc = typeof navigator < "u" && typeof navigator.product == "string" && navigator.product.toLowerCase() === "reactnative";
class Jp extends Po {
  get name() {
    return "websocket";
  }
  doOpen() {
    const t = this.uri(), n = this.opts.protocols, s = qc ? {} : $c(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    this.opts.extraHeaders && (s.headers = this.opts.extraHeaders);
    try {
      this.ws = this.createSocket(t, n, s);
    } catch (i) {
      return this.emitReserved("error", i);
    }
    this.ws.binaryType = this.socket.binaryType, this.addEventListeners();
  }
  /**
   * Adds event listeners to the socket
   *
   * @private
   */
  addEventListeners() {
    this.ws.onopen = () => {
      this.opts.autoUnref && this.ws._socket.unref(), this.onOpen();
    }, this.ws.onclose = (t) => this.onClose({
      description: "websocket connection closed",
      context: t
    }), this.ws.onmessage = (t) => this.onData(t.data), this.ws.onerror = (t) => this.onError("websocket error", t);
  }
  write(t) {
    this.writable = !1;
    for (let n = 0; n < t.length; n++) {
      const s = t[n], i = n === t.length - 1;
      Oo(s, this.supportsBinary, (r) => {
        try {
          this.doWrite(s, r);
        } catch {
        }
        i && tr(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    typeof this.ws < "u" && (this.ws.onerror = () => {
    }, this.ws.close(), this.ws = null);
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const t = this.opts.secure ? "wss" : "ws", n = this.query || {};
    return this.opts.timestampRequests && (n[this.opts.timestampParam] = Uc()), this.supportsBinary || (n.b64 = 1), this.createUri(t, n);
  }
}
const Nr = Ht.WebSocket || Ht.MozWebSocket;
class Qp extends Jp {
  createSocket(t, n, s) {
    return qc ? new Nr(t, n, s) : n ? new Nr(t, n) : new Nr(t);
  }
  doWrite(t, n) {
    this.ws.send(n);
  }
}
class eg extends Po {
  get name() {
    return "webtransport";
  }
  doOpen() {
    try {
      this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
    } catch (t) {
      return this.emitReserved("error", t);
    }
    this._transport.closed.then(() => {
      this.onClose();
    }).catch((t) => {
      this.onError("webtransport error", t);
    }), this._transport.ready.then(() => {
      this._transport.createBidirectionalStream().then((t) => {
        const n = Mp(Number.MAX_SAFE_INTEGER, this.socket.binaryType), s = t.readable.pipeThrough(n).getReader(), i = Pp();
        i.readable.pipeTo(t.writable), this._writer = i.writable.getWriter();
        const r = () => {
          s.read().then(({ done: a, value: l }) => {
            a || (this.onPacket(l), r());
          }).catch((a) => {
          });
        };
        r();
        const o = { type: "open" };
        this.query.sid && (o.data = `{"sid":"${this.query.sid}"}`), this._writer.write(o).then(() => this.onOpen());
      });
    });
  }
  write(t) {
    this.writable = !1;
    for (let n = 0; n < t.length; n++) {
      const s = t[n], i = n === t.length - 1;
      this._writer.write(s).then(() => {
        i && tr(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    var t;
    (t = this._transport) === null || t === void 0 || t.close();
  }
}
const tg = {
  websocket: Qp,
  webtransport: eg,
  polling: Zp
}, ng = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, sg = [
  "source",
  "protocol",
  "authority",
  "userInfo",
  "user",
  "password",
  "host",
  "port",
  "relative",
  "path",
  "directory",
  "file",
  "query",
  "anchor"
];
function eo(e) {
  if (e.length > 8e3)
    throw "URI too long";
  const t = e, n = e.indexOf("["), s = e.indexOf("]");
  n != -1 && s != -1 && (e = e.substring(0, n) + e.substring(n, s).replace(/:/g, ";") + e.substring(s, e.length));
  let i = ng.exec(e || ""), r = {}, o = 14;
  for (; o--; )
    r[sg[o]] = i[o] || "";
  return n != -1 && s != -1 && (r.source = t, r.host = r.host.substring(1, r.host.length - 1).replace(/;/g, ":"), r.authority = r.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), r.ipv6uri = !0), r.pathNames = ig(r, r.path), r.queryKey = rg(r, r.query), r;
}
function ig(e, t) {
  const n = /\/{2,9}/g, s = t.replace(n, "/").split("/");
  return (t.slice(0, 1) == "/" || t.length === 0) && s.splice(0, 1), t.slice(-1) == "/" && s.splice(s.length - 1, 1), s;
}
function rg(e, t) {
  const n = {};
  return t.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(s, i, r) {
    i && (n[i] = r);
  }), n;
}
const to = typeof addEventListener == "function" && typeof removeEventListener == "function", Si = [];
to && addEventListener("offline", () => {
  Si.forEach((e) => e());
}, !1);
class Ln extends lt {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri - uri or options
   * @param {Object} opts - options
   */
  constructor(t, n) {
    if (super(), this.binaryType = Dp, this.writeBuffer = [], this._prevBufferLen = 0, this._pingInterval = -1, this._pingTimeout = -1, this._maxPayload = -1, this._pingTimeoutTime = 1 / 0, t && typeof t == "object" && (n = t, t = null), t) {
      const s = eo(t);
      n.hostname = s.host, n.secure = s.protocol === "https" || s.protocol === "wss", n.port = s.port, s.query && (n.query = s.query);
    } else n.host && (n.hostname = eo(n.host).host);
    nr(this, n), this.secure = n.secure != null ? n.secure : typeof location < "u" && location.protocol === "https:", n.hostname && !n.port && (n.port = this.secure ? "443" : "80"), this.hostname = n.hostname || (typeof location < "u" ? location.hostname : "localhost"), this.port = n.port || (typeof location < "u" && location.port ? location.port : this.secure ? "443" : "80"), this.transports = [], this._transportsByName = {}, n.transports.forEach((s) => {
      const i = s.prototype.name;
      this.transports.push(i), this._transportsByName[i] = s;
    }), this.opts = Object.assign({
      path: "/engine.io",
      agent: !1,
      withCredentials: !1,
      upgrade: !0,
      timestampParam: "t",
      rememberUpgrade: !1,
      addTrailingSlash: !0,
      rejectUnauthorized: !0,
      perMessageDeflate: {
        threshold: 1024
      },
      transportOptions: {},
      closeOnBeforeunload: !1
    }, n), this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : ""), typeof this.opts.query == "string" && (this.opts.query = Wp(this.opts.query)), to && (this.opts.closeOnBeforeunload && (this._beforeunloadEventListener = () => {
      this.transport && (this.transport.removeAllListeners(), this.transport.close());
    }, addEventListener("beforeunload", this._beforeunloadEventListener, !1)), this.hostname !== "localhost" && (this._offlineEventListener = () => {
      this._onClose("transport close", {
        description: "network connection lost"
      });
    }, Si.push(this._offlineEventListener))), this.opts.withCredentials && (this._cookieJar = void 0), this._open();
  }
  /**
   * Creates transport of the given type.
   *
   * @param {String} name - transport name
   * @return {Transport}
   * @private
   */
  createTransport(t) {
    const n = Object.assign({}, this.opts.query);
    n.EIO = Bc, n.transport = t, this.id && (n.sid = this.id);
    const s = Object.assign({}, this.opts, {
      query: n,
      socket: this,
      hostname: this.hostname,
      secure: this.secure,
      port: this.port
    }, this.opts.transportOptions[t]);
    return new this._transportsByName[t](s);
  }
  /**
   * Initializes transport to use and starts probe.
   *
   * @private
   */
  _open() {
    if (this.transports.length === 0) {
      this.setTimeoutFn(() => {
        this.emitReserved("error", "No transports available");
      }, 0);
      return;
    }
    const t = this.opts.rememberUpgrade && Ln.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
    this.readyState = "opening";
    const n = this.createTransport(t);
    n.open(), this.setTransport(n);
  }
  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @private
   */
  setTransport(t) {
    this.transport && this.transport.removeAllListeners(), this.transport = t, t.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (n) => this._onClose("transport close", n));
  }
  /**
   * Called when connection is deemed open.
   *
   * @private
   */
  onOpen() {
    this.readyState = "open", Ln.priorWebsocketSuccess = this.transport.name === "websocket", this.emitReserved("open"), this.flush();
  }
  /**
   * Handles a packet.
   *
   * @private
   */
  _onPacket(t) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing")
      switch (this.emitReserved("packet", t), this.emitReserved("heartbeat"), t.type) {
        case "open":
          this.onHandshake(JSON.parse(t.data));
          break;
        case "ping":
          this._sendPacket("pong"), this.emitReserved("ping"), this.emitReserved("pong"), this._resetPingTimeout();
          break;
        case "error":
          const n = new Error("server error");
          n.code = t.data, this._onError(n);
          break;
        case "message":
          this.emitReserved("data", t.data), this.emitReserved("message", t.data);
          break;
      }
  }
  /**
   * Called upon handshake completion.
   *
   * @param {Object} data - handshake obj
   * @private
   */
  onHandshake(t) {
    this.emitReserved("handshake", t), this.id = t.sid, this.transport.query.sid = t.sid, this._pingInterval = t.pingInterval, this._pingTimeout = t.pingTimeout, this._maxPayload = t.maxPayload, this.onOpen(), this.readyState !== "closed" && this._resetPingTimeout();
  }
  /**
   * Sets and resets ping timeout timer based on server pings.
   *
   * @private
   */
  _resetPingTimeout() {
    this.clearTimeoutFn(this._pingTimeoutTimer);
    const t = this._pingInterval + this._pingTimeout;
    this._pingTimeoutTime = Date.now() + t, this._pingTimeoutTimer = this.setTimeoutFn(() => {
      this._onClose("ping timeout");
    }, t), this.opts.autoUnref && this._pingTimeoutTimer.unref();
  }
  /**
   * Called on `drain` event
   *
   * @private
   */
  _onDrain() {
    this.writeBuffer.splice(0, this._prevBufferLen), this._prevBufferLen = 0, this.writeBuffer.length === 0 ? this.emitReserved("drain") : this.flush();
  }
  /**
   * Flush write buffers.
   *
   * @private
   */
  flush() {
    if (this.readyState !== "closed" && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      const t = this._getWritablePackets();
      this.transport.send(t), this._prevBufferLen = t.length, this.emitReserved("flush");
    }
  }
  /**
   * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
   * long-polling)
   *
   * @private
   */
  _getWritablePackets() {
    if (!(this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1))
      return this.writeBuffer;
    let n = 1;
    for (let s = 0; s < this.writeBuffer.length; s++) {
      const i = this.writeBuffer[s].data;
      if (i && (n += zp(i)), s > 0 && n > this._maxPayload)
        return this.writeBuffer.slice(0, s);
      n += 2;
    }
    return this.writeBuffer;
  }
  /**
   * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
   *
   * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
   * `write()` method then the message would not be buffered by the Socket.IO client.
   *
   * @return {boolean}
   * @private
   */
  /* private */
  _hasPingExpired() {
    if (!this._pingTimeoutTime)
      return !0;
    const t = Date.now() > this._pingTimeoutTime;
    return t && (this._pingTimeoutTime = 0, tr(() => {
      this._onClose("ping timeout");
    }, this.setTimeoutFn)), t;
  }
  /**
   * Sends a message.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  write(t, n, s) {
    return this._sendPacket("message", t, n, s), this;
  }
  /**
   * Sends a message. Alias of {@link Socket#write}.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  send(t, n, s) {
    return this._sendPacket("message", t, n, s), this;
  }
  /**
   * Sends a packet.
   *
   * @param {String} type: packet type.
   * @param {String} data.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @private
   */
  _sendPacket(t, n, s, i) {
    if (typeof n == "function" && (i = n, n = void 0), typeof s == "function" && (i = s, s = null), this.readyState === "closing" || this.readyState === "closed")
      return;
    s = s || {}, s.compress = s.compress !== !1;
    const r = {
      type: t,
      data: n,
      options: s
    };
    this.emitReserved("packetCreate", r), this.writeBuffer.push(r), i && this.once("flush", i), this.flush();
  }
  /**
   * Closes the connection.
   */
  close() {
    const t = () => {
      this._onClose("forced close"), this.transport.close();
    }, n = () => {
      this.off("upgrade", n), this.off("upgradeError", n), t();
    }, s = () => {
      this.once("upgrade", n), this.once("upgradeError", n);
    };
    return (this.readyState === "opening" || this.readyState === "open") && (this.readyState = "closing", this.writeBuffer.length ? this.once("drain", () => {
      this.upgrading ? s() : t();
    }) : this.upgrading ? s() : t()), this;
  }
  /**
   * Called upon transport error
   *
   * @private
   */
  _onError(t) {
    if (Ln.priorWebsocketSuccess = !1, this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening")
      return this.transports.shift(), this._open();
    this.emitReserved("error", t), this._onClose("transport error", t);
  }
  /**
   * Called upon transport close.
   *
   * @private
   */
  _onClose(t, n) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing") {
      if (this.clearTimeoutFn(this._pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), to && (this._beforeunloadEventListener && removeEventListener("beforeunload", this._beforeunloadEventListener, !1), this._offlineEventListener)) {
        const s = Si.indexOf(this._offlineEventListener);
        s !== -1 && Si.splice(s, 1);
      }
      this.readyState = "closed", this.id = null, this.emitReserved("close", t, n), this.writeBuffer = [], this._prevBufferLen = 0;
    }
  }
}
Ln.protocol = Bc;
class og extends Ln {
  constructor() {
    super(...arguments), this._upgrades = [];
  }
  onOpen() {
    if (super.onOpen(), this.readyState === "open" && this.opts.upgrade)
      for (let t = 0; t < this._upgrades.length; t++)
        this._probe(this._upgrades[t]);
  }
  /**
   * Probes a transport.
   *
   * @param {String} name - transport name
   * @private
   */
  _probe(t) {
    let n = this.createTransport(t), s = !1;
    Ln.priorWebsocketSuccess = !1;
    const i = () => {
      s || (n.send([{ type: "ping", data: "probe" }]), n.once("packet", (w) => {
        if (!s)
          if (w.type === "pong" && w.data === "probe") {
            if (this.upgrading = !0, this.emitReserved("upgrading", n), !n)
              return;
            Ln.priorWebsocketSuccess = n.name === "websocket", this.transport.pause(() => {
              s || this.readyState !== "closed" && (c(), this.setTransport(n), n.send([{ type: "upgrade" }]), this.emitReserved("upgrade", n), n = null, this.upgrading = !1, this.flush());
            });
          } else {
            const k = new Error("probe error");
            k.transport = n.name, this.emitReserved("upgradeError", k);
          }
      }));
    };
    function r() {
      s || (s = !0, c(), n.close(), n = null);
    }
    const o = (w) => {
      const k = new Error("probe error: " + w);
      k.transport = n.name, r(), this.emitReserved("upgradeError", k);
    };
    function a() {
      o("transport closed");
    }
    function l() {
      o("socket closed");
    }
    function d(w) {
      n && w.name !== n.name && r();
    }
    const c = () => {
      n.removeListener("open", i), n.removeListener("error", o), n.removeListener("close", a), this.off("close", l), this.off("upgrading", d);
    };
    n.once("open", i), n.once("error", o), n.once("close", a), this.once("close", l), this.once("upgrading", d), this._upgrades.indexOf("webtransport") !== -1 && t !== "webtransport" ? this.setTimeoutFn(() => {
      s || n.open();
    }, 200) : n.open();
  }
  onHandshake(t) {
    this._upgrades = this._filterUpgrades(t.upgrades), super.onHandshake(t);
  }
  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} upgrades - server upgrades
   * @private
   */
  _filterUpgrades(t) {
    const n = [];
    for (let s = 0; s < t.length; s++)
      ~this.transports.indexOf(t[s]) && n.push(t[s]);
    return n;
  }
}
let ag = class extends og {
  constructor(t, n = {}) {
    const s = typeof t == "object" ? t : n;
    (!s.transports || s.transports && typeof s.transports[0] == "string") && (s.transports = (s.transports || ["polling", "websocket", "webtransport"]).map((i) => tg[i]).filter((i) => !!i)), super(t, s);
  }
};
function lg(e, t = "", n) {
  let s = e;
  n = n || typeof location < "u" && location, e == null && (e = n.protocol + "//" + n.host), typeof e == "string" && (e.charAt(0) === "/" && (e.charAt(1) === "/" ? e = n.protocol + e : e = n.host + e), /^(https?|wss?):\/\//.test(e) || (typeof n < "u" ? e = n.protocol + "//" + e : e = "https://" + e), s = eo(e)), s.port || (/^(http|ws)$/.test(s.protocol) ? s.port = "80" : /^(http|ws)s$/.test(s.protocol) && (s.port = "443")), s.path = s.path || "/";
  const r = s.host.indexOf(":") !== -1 ? "[" + s.host + "]" : s.host;
  return s.id = s.protocol + "://" + r + ":" + s.port + t, s.href = s.protocol + "://" + r + (n && n.port === s.port ? "" : ":" + s.port), s;
}
const cg = typeof ArrayBuffer == "function", ug = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e.buffer instanceof ArrayBuffer, Wc = Object.prototype.toString, fg = typeof Blob == "function" || typeof Blob < "u" && Wc.call(Blob) === "[object BlobConstructor]", hg = typeof File == "function" || typeof File < "u" && Wc.call(File) === "[object FileConstructor]";
function Mo(e) {
  return cg && (e instanceof ArrayBuffer || ug(e)) || fg && e instanceof Blob || hg && e instanceof File;
}
function Ei(e, t) {
  if (!e || typeof e != "object")
    return !1;
  if (Array.isArray(e)) {
    for (let n = 0, s = e.length; n < s; n++)
      if (Ei(e[n]))
        return !0;
    return !1;
  }
  if (Mo(e))
    return !0;
  if (e.toJSON && typeof e.toJSON == "function" && arguments.length === 1)
    return Ei(e.toJSON(), !0);
  for (const n in e)
    if (Object.prototype.hasOwnProperty.call(e, n) && Ei(e[n]))
      return !0;
  return !1;
}
function dg(e) {
  const t = [], n = e.data, s = e;
  return s.data = no(n, t), s.attachments = t.length, { packet: s, buffers: t };
}
function no(e, t) {
  if (!e)
    return e;
  if (Mo(e)) {
    const n = { _placeholder: !0, num: t.length };
    return t.push(e), n;
  } else if (Array.isArray(e)) {
    const n = new Array(e.length);
    for (let s = 0; s < e.length; s++)
      n[s] = no(e[s], t);
    return n;
  } else if (typeof e == "object" && !(e instanceof Date)) {
    const n = {};
    for (const s in e)
      Object.prototype.hasOwnProperty.call(e, s) && (n[s] = no(e[s], t));
    return n;
  }
  return e;
}
function pg(e, t) {
  return e.data = so(e.data, t), delete e.attachments, e;
}
function so(e, t) {
  if (!e)
    return e;
  if (e && e._placeholder === !0) {
    if (typeof e.num == "number" && e.num >= 0 && e.num < t.length)
      return t[e.num];
    throw new Error("illegal attachments");
  } else if (Array.isArray(e))
    for (let n = 0; n < e.length; n++)
      e[n] = so(e[n], t);
  else if (typeof e == "object")
    for (const n in e)
      Object.prototype.hasOwnProperty.call(e, n) && (e[n] = so(e[n], t));
  return e;
}
const gg = [
  "connect",
  "connect_error",
  "disconnect",
  "disconnecting",
  "newListener",
  "removeListener"
  // used by the Node.js EventEmitter
];
var Ie;
(function(e) {
  e[e.CONNECT = 0] = "CONNECT", e[e.DISCONNECT = 1] = "DISCONNECT", e[e.EVENT = 2] = "EVENT", e[e.ACK = 3] = "ACK", e[e.CONNECT_ERROR = 4] = "CONNECT_ERROR", e[e.BINARY_EVENT = 5] = "BINARY_EVENT", e[e.BINARY_ACK = 6] = "BINARY_ACK";
})(Ie || (Ie = {}));
class mg {
  /**
   * Encoder constructor
   *
   * @param {function} replacer - custom replacer to pass down to JSON.parse
   */
  constructor(t) {
    this.replacer = t;
  }
  /**
   * Encode a packet as a single string if non-binary, or as a
   * buffer sequence, depending on packet type.
   *
   * @param {Object} obj - packet object
   */
  encode(t) {
    return (t.type === Ie.EVENT || t.type === Ie.ACK) && Ei(t) ? this.encodeAsBinary({
      type: t.type === Ie.EVENT ? Ie.BINARY_EVENT : Ie.BINARY_ACK,
      nsp: t.nsp,
      data: t.data,
      id: t.id
    }) : [this.encodeAsString(t)];
  }
  /**
   * Encode packet as string.
   */
  encodeAsString(t) {
    let n = "" + t.type;
    return (t.type === Ie.BINARY_EVENT || t.type === Ie.BINARY_ACK) && (n += t.attachments + "-"), t.nsp && t.nsp !== "/" && (n += t.nsp + ","), t.id != null && (n += t.id), t.data != null && (n += JSON.stringify(t.data, this.replacer)), n;
  }
  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   */
  encodeAsBinary(t) {
    const n = dg(t), s = this.encodeAsString(n.packet), i = n.buffers;
    return i.unshift(s), i;
  }
}
function il(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
class Fo extends lt {
  /**
   * Decoder constructor
   *
   * @param {function} reviver - custom reviver to pass down to JSON.stringify
   */
  constructor(t) {
    super(), this.reviver = t;
  }
  /**
   * Decodes an encoded packet string into packet JSON.
   *
   * @param {String} obj - encoded packet
   */
  add(t) {
    let n;
    if (typeof t == "string") {
      if (this.reconstructor)
        throw new Error("got plaintext data when reconstructing a packet");
      n = this.decodeString(t);
      const s = n.type === Ie.BINARY_EVENT;
      s || n.type === Ie.BINARY_ACK ? (n.type = s ? Ie.EVENT : Ie.ACK, this.reconstructor = new _g(n), n.attachments === 0 && super.emitReserved("decoded", n)) : super.emitReserved("decoded", n);
    } else if (Mo(t) || t.base64)
      if (this.reconstructor)
        n = this.reconstructor.takeBinaryData(t), n && (this.reconstructor = null, super.emitReserved("decoded", n));
      else
        throw new Error("got binary data when not reconstructing a packet");
    else
      throw new Error("Unknown type: " + t);
  }
  /**
   * Decode a packet String (JSON data)
   *
   * @param {String} str
   * @return {Object} packet
   */
  decodeString(t) {
    let n = 0;
    const s = {
      type: Number(t.charAt(0))
    };
    if (Ie[s.type] === void 0)
      throw new Error("unknown packet type " + s.type);
    if (s.type === Ie.BINARY_EVENT || s.type === Ie.BINARY_ACK) {
      const r = n + 1;
      for (; t.charAt(++n) !== "-" && n != t.length; )
        ;
      const o = t.substring(r, n);
      if (o != Number(o) || t.charAt(n) !== "-")
        throw new Error("Illegal attachments");
      s.attachments = Number(o);
    }
    if (t.charAt(n + 1) === "/") {
      const r = n + 1;
      for (; ++n && !(t.charAt(n) === "," || n === t.length); )
        ;
      s.nsp = t.substring(r, n);
    } else
      s.nsp = "/";
    const i = t.charAt(n + 1);
    if (i !== "" && Number(i) == i) {
      const r = n + 1;
      for (; ++n; ) {
        const o = t.charAt(n);
        if (o == null || Number(o) != o) {
          --n;
          break;
        }
        if (n === t.length)
          break;
      }
      s.id = Number(t.substring(r, n + 1));
    }
    if (t.charAt(++n)) {
      const r = this.tryParse(t.substr(n));
      if (Fo.isPayloadValid(s.type, r))
        s.data = r;
      else
        throw new Error("invalid payload");
    }
    return s;
  }
  tryParse(t) {
    try {
      return JSON.parse(t, this.reviver);
    } catch {
      return !1;
    }
  }
  static isPayloadValid(t, n) {
    switch (t) {
      case Ie.CONNECT:
        return il(n);
      case Ie.DISCONNECT:
        return n === void 0;
      case Ie.CONNECT_ERROR:
        return typeof n == "string" || il(n);
      case Ie.EVENT:
      case Ie.BINARY_EVENT:
        return Array.isArray(n) && (typeof n[0] == "number" || typeof n[0] == "string" && gg.indexOf(n[0]) === -1);
      case Ie.ACK:
      case Ie.BINARY_ACK:
        return Array.isArray(n);
    }
  }
  /**
   * Deallocates a parser's resources
   */
  destroy() {
    this.reconstructor && (this.reconstructor.finishedReconstruction(), this.reconstructor = null);
  }
}
class _g {
  constructor(t) {
    this.packet = t, this.buffers = [], this.reconPack = t;
  }
  /**
   * Method to be called when binary data received from connection
   * after a BINARY_EVENT packet.
   *
   * @param {Buffer | ArrayBuffer} binData - the raw binary data received
   * @return {null | Object} returns null if more binary data is expected or
   *   a reconstructed packet object if all buffers have been received.
   */
  takeBinaryData(t) {
    if (this.buffers.push(t), this.buffers.length === this.reconPack.attachments) {
      const n = pg(this.reconPack, this.buffers);
      return this.finishedReconstruction(), n;
    }
    return null;
  }
  /**
   * Cleans up binary packet reconstruction variables.
   */
  finishedReconstruction() {
    this.reconPack = null, this.buffers = [];
  }
}
const yg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Decoder: Fo,
  Encoder: mg,
  get PacketType() {
    return Ie;
  }
}, Symbol.toStringTag, { value: "Module" }));
function Jt(e, t, n) {
  return e.on(t, n), function() {
    e.off(t, n);
  };
}
const vg = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
  newListener: 1,
  removeListener: 1
});
class jc extends lt {
  /**
   * `Socket` constructor.
   */
  constructor(t, n, s) {
    super(), this.connected = !1, this.recovered = !1, this.receiveBuffer = [], this.sendBuffer = [], this._queue = [], this._queueSeq = 0, this.ids = 0, this.acks = {}, this.flags = {}, this.io = t, this.nsp = n, s && s.auth && (this.auth = s.auth), this._opts = Object.assign({}, s), this.io._autoConnect && this.open();
  }
  /**
   * Whether the socket is currently disconnected
   *
   * @example
   * const socket = io();
   *
   * socket.on("connect", () => {
   *   console.log(socket.disconnected); // false
   * });
   *
   * socket.on("disconnect", () => {
   *   console.log(socket.disconnected); // true
   * });
   */
  get disconnected() {
    return !this.connected;
  }
  /**
   * Subscribe to open, close and packet events
   *
   * @private
   */
  subEvents() {
    if (this.subs)
      return;
    const t = this.io;
    this.subs = [
      Jt(t, "open", this.onopen.bind(this)),
      Jt(t, "packet", this.onpacket.bind(this)),
      Jt(t, "error", this.onerror.bind(this)),
      Jt(t, "close", this.onclose.bind(this))
    ];
  }
  /**
   * Whether the Socket will try to reconnect when its Manager connects or reconnects.
   *
   * @example
   * const socket = io();
   *
   * console.log(socket.active); // true
   *
   * socket.on("disconnect", (reason) => {
   *   if (reason === "io server disconnect") {
   *     // the disconnection was initiated by the server, you need to manually reconnect
   *     console.log(socket.active); // false
   *   }
   *   // else the socket will automatically try to reconnect
   *   console.log(socket.active); // true
   * });
   */
  get active() {
    return !!this.subs;
  }
  /**
   * "Opens" the socket.
   *
   * @example
   * const socket = io({
   *   autoConnect: false
   * });
   *
   * socket.connect();
   */
  connect() {
    return this.connected ? this : (this.subEvents(), this.io._reconnecting || this.io.open(), this.io._readyState === "open" && this.onopen(), this);
  }
  /**
   * Alias for {@link connect()}.
   */
  open() {
    return this.connect();
  }
  /**
   * Sends a `message` event.
   *
   * This method mimics the WebSocket.send() method.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
   *
   * @example
   * socket.send("hello");
   *
   * // this is equivalent to
   * socket.emit("message", "hello");
   *
   * @return self
   */
  send(...t) {
    return t.unshift("message"), this.emit.apply(this, t), this;
  }
  /**
   * Override `emit`.
   * If the event is in `events`, it's emitted normally.
   *
   * @example
   * socket.emit("hello", "world");
   *
   * // all serializable datastructures are supported (no need to call JSON.stringify)
   * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
   *
   * // with an acknowledgement from the server
   * socket.emit("hello", "world", (val) => {
   *   // ...
   * });
   *
   * @return self
   */
  emit(t, ...n) {
    var s, i, r;
    if (vg.hasOwnProperty(t))
      throw new Error('"' + t.toString() + '" is a reserved event name');
    if (n.unshift(t), this._opts.retries && !this.flags.fromQueue && !this.flags.volatile)
      return this._addToQueue(n), this;
    const o = {
      type: Ie.EVENT,
      data: n
    };
    if (o.options = {}, o.options.compress = this.flags.compress !== !1, typeof n[n.length - 1] == "function") {
      const c = this.ids++, w = n.pop();
      this._registerAckCallback(c, w), o.id = c;
    }
    const a = (i = (s = this.io.engine) === null || s === void 0 ? void 0 : s.transport) === null || i === void 0 ? void 0 : i.writable, l = this.connected && !(!((r = this.io.engine) === null || r === void 0) && r._hasPingExpired());
    return this.flags.volatile && !a || (l ? (this.notifyOutgoingListeners(o), this.packet(o)) : this.sendBuffer.push(o)), this.flags = {}, this;
  }
  /**
   * @private
   */
  _registerAckCallback(t, n) {
    var s;
    const i = (s = this.flags.timeout) !== null && s !== void 0 ? s : this._opts.ackTimeout;
    if (i === void 0) {
      this.acks[t] = n;
      return;
    }
    const r = this.io.setTimeoutFn(() => {
      delete this.acks[t];
      for (let a = 0; a < this.sendBuffer.length; a++)
        this.sendBuffer[a].id === t && this.sendBuffer.splice(a, 1);
      n.call(this, new Error("operation has timed out"));
    }, i), o = (...a) => {
      this.io.clearTimeoutFn(r), n.apply(this, a);
    };
    o.withError = !0, this.acks[t] = o;
  }
  /**
   * Emits an event and waits for an acknowledgement
   *
   * @example
   * // without timeout
   * const response = await socket.emitWithAck("hello", "world");
   *
   * // with a specific timeout
   * try {
   *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
   * } catch (err) {
   *   // the server did not acknowledge the event in the given delay
   * }
   *
   * @return a Promise that will be fulfilled when the server acknowledges the event
   */
  emitWithAck(t, ...n) {
    return new Promise((s, i) => {
      const r = (o, a) => o ? i(o) : s(a);
      r.withError = !0, n.push(r), this.emit(t, ...n);
    });
  }
  /**
   * Add the packet to the queue.
   * @param args
   * @private
   */
  _addToQueue(t) {
    let n;
    typeof t[t.length - 1] == "function" && (n = t.pop());
    const s = {
      id: this._queueSeq++,
      tryCount: 0,
      pending: !1,
      args: t,
      flags: Object.assign({ fromQueue: !0 }, this.flags)
    };
    t.push((i, ...r) => s !== this._queue[0] ? void 0 : (i !== null ? s.tryCount > this._opts.retries && (this._queue.shift(), n && n(i)) : (this._queue.shift(), n && n(null, ...r)), s.pending = !1, this._drainQueue())), this._queue.push(s), this._drainQueue();
  }
  /**
   * Send the first packet of the queue, and wait for an acknowledgement from the server.
   * @param force - whether to resend a packet that has not been acknowledged yet
   *
   * @private
   */
  _drainQueue(t = !1) {
    if (!this.connected || this._queue.length === 0)
      return;
    const n = this._queue[0];
    n.pending && !t || (n.pending = !0, n.tryCount++, this.flags = n.flags, this.emit.apply(this, n.args));
  }
  /**
   * Sends a packet.
   *
   * @param packet
   * @private
   */
  packet(t) {
    t.nsp = this.nsp, this.io._packet(t);
  }
  /**
   * Called upon engine `open`.
   *
   * @private
   */
  onopen() {
    typeof this.auth == "function" ? this.auth((t) => {
      this._sendConnectPacket(t);
    }) : this._sendConnectPacket(this.auth);
  }
  /**
   * Sends a CONNECT packet to initiate the Socket.IO session.
   *
   * @param data
   * @private
   */
  _sendConnectPacket(t) {
    this.packet({
      type: Ie.CONNECT,
      data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, t) : t
    });
  }
  /**
   * Called upon engine or manager `error`.
   *
   * @param err
   * @private
   */
  onerror(t) {
    this.connected || this.emitReserved("connect_error", t);
  }
  /**
   * Called upon engine `close`.
   *
   * @param reason
   * @param description
   * @private
   */
  onclose(t, n) {
    this.connected = !1, delete this.id, this.emitReserved("disconnect", t, n), this._clearAcks();
  }
  /**
   * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
   * the server.
   *
   * @private
   */
  _clearAcks() {
    Object.keys(this.acks).forEach((t) => {
      if (!this.sendBuffer.some((s) => String(s.id) === t)) {
        const s = this.acks[t];
        delete this.acks[t], s.withError && s.call(this, new Error("socket has been disconnected"));
      }
    });
  }
  /**
   * Called with socket packet.
   *
   * @param packet
   * @private
   */
  onpacket(t) {
    if (t.nsp === this.nsp)
      switch (t.type) {
        case Ie.CONNECT:
          t.data && t.data.sid ? this.onconnect(t.data.sid, t.data.pid) : this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          break;
        case Ie.EVENT:
        case Ie.BINARY_EVENT:
          this.onevent(t);
          break;
        case Ie.ACK:
        case Ie.BINARY_ACK:
          this.onack(t);
          break;
        case Ie.DISCONNECT:
          this.ondisconnect();
          break;
        case Ie.CONNECT_ERROR:
          this.destroy();
          const s = new Error(t.data.message);
          s.data = t.data.data, this.emitReserved("connect_error", s);
          break;
      }
  }
  /**
   * Called upon a server event.
   *
   * @param packet
   * @private
   */
  onevent(t) {
    const n = t.data || [];
    t.id != null && n.push(this.ack(t.id)), this.connected ? this.emitEvent(n) : this.receiveBuffer.push(Object.freeze(n));
  }
  emitEvent(t) {
    if (this._anyListeners && this._anyListeners.length) {
      const n = this._anyListeners.slice();
      for (const s of n)
        s.apply(this, t);
    }
    super.emit.apply(this, t), this._pid && t.length && typeof t[t.length - 1] == "string" && (this._lastOffset = t[t.length - 1]);
  }
  /**
   * Produces an ack callback to emit with an event.
   *
   * @private
   */
  ack(t) {
    const n = this;
    let s = !1;
    return function(...i) {
      s || (s = !0, n.packet({
        type: Ie.ACK,
        id: t,
        data: i
      }));
    };
  }
  /**
   * Called upon a server acknowledgement.
   *
   * @param packet
   * @private
   */
  onack(t) {
    const n = this.acks[t.id];
    typeof n == "function" && (delete this.acks[t.id], n.withError && t.data.unshift(null), n.apply(this, t.data));
  }
  /**
   * Called upon server connect.
   *
   * @private
   */
  onconnect(t, n) {
    this.id = t, this.recovered = n && this._pid === n, this._pid = n, this.connected = !0, this.emitBuffered(), this.emitReserved("connect"), this._drainQueue(!0);
  }
  /**
   * Emit buffered events (received and emitted).
   *
   * @private
   */
  emitBuffered() {
    this.receiveBuffer.forEach((t) => this.emitEvent(t)), this.receiveBuffer = [], this.sendBuffer.forEach((t) => {
      this.notifyOutgoingListeners(t), this.packet(t);
    }), this.sendBuffer = [];
  }
  /**
   * Called upon server disconnect.
   *
   * @private
   */
  ondisconnect() {
    this.destroy(), this.onclose("io server disconnect");
  }
  /**
   * Called upon forced client/server side disconnections,
   * this method ensures the manager stops tracking us and
   * that reconnections don't get triggered for this.
   *
   * @private
   */
  destroy() {
    this.subs && (this.subs.forEach((t) => t()), this.subs = void 0), this.io._destroy(this);
  }
  /**
   * Disconnects the socket manually. In that case, the socket will not try to reconnect.
   *
   * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
   *
   * @example
   * const socket = io();
   *
   * socket.on("disconnect", (reason) => {
   *   // console.log(reason); prints "io client disconnect"
   * });
   *
   * socket.disconnect();
   *
   * @return self
   */
  disconnect() {
    return this.connected && this.packet({ type: Ie.DISCONNECT }), this.destroy(), this.connected && this.onclose("io client disconnect"), this;
  }
  /**
   * Alias for {@link disconnect()}.
   *
   * @return self
   */
  close() {
    return this.disconnect();
  }
  /**
   * Sets the compress flag.
   *
   * @example
   * socket.compress(false).emit("hello");
   *
   * @param compress - if `true`, compresses the sending data
   * @return self
   */
  compress(t) {
    return this.flags.compress = t, this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
   * ready to send messages.
   *
   * @example
   * socket.volatile.emit("hello"); // the server may or may not receive it
   *
   * @returns self
   */
  get volatile() {
    return this.flags.volatile = !0, this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
   * given number of milliseconds have elapsed without an acknowledgement from the server:
   *
   * @example
   * socket.timeout(5000).emit("my-event", (err) => {
   *   if (err) {
   *     // the server did not acknowledge the event in the given delay
   *   }
   * });
   *
   * @returns self
   */
  timeout(t) {
    return this.flags.timeout = t, this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * @example
   * socket.onAny((event, ...args) => {
   *   console.log(`got ${event}`);
   * });
   *
   * @param listener
   */
  onAny(t) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.push(t), this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * @example
   * socket.prependAny((event, ...args) => {
   *   console.log(`got event ${event}`);
   * });
   *
   * @param listener
   */
  prependAny(t) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.unshift(t), this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`got event ${event}`);
   * }
   *
   * socket.onAny(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAny(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAny();
   *
   * @param listener
   */
  offAny(t) {
    if (!this._anyListeners)
      return this;
    if (t) {
      const n = this._anyListeners;
      for (let s = 0; s < n.length; s++)
        if (t === n[s])
          return n.splice(s, 1), this;
    } else
      this._anyListeners = [];
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAny() {
    return this._anyListeners || [];
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.onAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  onAnyOutgoing(t) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.push(t), this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.prependAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  prependAnyOutgoing(t) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.unshift(t), this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`sent event ${event}`);
   * }
   *
   * socket.onAnyOutgoing(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAnyOutgoing(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAnyOutgoing();
   *
   * @param [listener] - the catch-all listener (optional)
   */
  offAnyOutgoing(t) {
    if (!this._anyOutgoingListeners)
      return this;
    if (t) {
      const n = this._anyOutgoingListeners;
      for (let s = 0; s < n.length; s++)
        if (t === n[s])
          return n.splice(s, 1), this;
    } else
      this._anyOutgoingListeners = [];
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAnyOutgoing() {
    return this._anyOutgoingListeners || [];
  }
  /**
   * Notify the listeners for each packet sent
   *
   * @param packet
   *
   * @private
   */
  notifyOutgoingListeners(t) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const n = this._anyOutgoingListeners.slice();
      for (const s of n)
        s.apply(this, t.data);
    }
  }
}
function us(e) {
  e = e || {}, this.ms = e.min || 100, this.max = e.max || 1e4, this.factor = e.factor || 2, this.jitter = e.jitter > 0 && e.jitter <= 1 ? e.jitter : 0, this.attempts = 0;
}
us.prototype.duration = function() {
  var e = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var t = Math.random(), n = Math.floor(t * this.jitter * e);
    e = (Math.floor(t * 10) & 1) == 0 ? e - n : e + n;
  }
  return Math.min(e, this.max) | 0;
};
us.prototype.reset = function() {
  this.attempts = 0;
};
us.prototype.setMin = function(e) {
  this.ms = e;
};
us.prototype.setMax = function(e) {
  this.max = e;
};
us.prototype.setJitter = function(e) {
  this.jitter = e;
};
class io extends lt {
  constructor(t, n) {
    var s;
    super(), this.nsps = {}, this.subs = [], t && typeof t == "object" && (n = t, t = void 0), n = n || {}, n.path = n.path || "/socket.io", this.opts = n, nr(this, n), this.reconnection(n.reconnection !== !1), this.reconnectionAttempts(n.reconnectionAttempts || 1 / 0), this.reconnectionDelay(n.reconnectionDelay || 1e3), this.reconnectionDelayMax(n.reconnectionDelayMax || 5e3), this.randomizationFactor((s = n.randomizationFactor) !== null && s !== void 0 ? s : 0.5), this.backoff = new us({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    }), this.timeout(n.timeout == null ? 2e4 : n.timeout), this._readyState = "closed", this.uri = t;
    const i = n.parser || yg;
    this.encoder = new i.Encoder(), this.decoder = new i.Decoder(), this._autoConnect = n.autoConnect !== !1, this._autoConnect && this.open();
  }
  reconnection(t) {
    return arguments.length ? (this._reconnection = !!t, t || (this.skipReconnect = !0), this) : this._reconnection;
  }
  reconnectionAttempts(t) {
    return t === void 0 ? this._reconnectionAttempts : (this._reconnectionAttempts = t, this);
  }
  reconnectionDelay(t) {
    var n;
    return t === void 0 ? this._reconnectionDelay : (this._reconnectionDelay = t, (n = this.backoff) === null || n === void 0 || n.setMin(t), this);
  }
  randomizationFactor(t) {
    var n;
    return t === void 0 ? this._randomizationFactor : (this._randomizationFactor = t, (n = this.backoff) === null || n === void 0 || n.setJitter(t), this);
  }
  reconnectionDelayMax(t) {
    var n;
    return t === void 0 ? this._reconnectionDelayMax : (this._reconnectionDelayMax = t, (n = this.backoff) === null || n === void 0 || n.setMax(t), this);
  }
  timeout(t) {
    return arguments.length ? (this._timeout = t, this) : this._timeout;
  }
  /**
   * Starts trying to reconnect if reconnection is enabled and we have not
   * started reconnecting yet
   *
   * @private
   */
  maybeReconnectOnOpen() {
    !this._reconnecting && this._reconnection && this.backoff.attempts === 0 && this.reconnect();
  }
  /**
   * Sets the current transport `socket`.
   *
   * @param {Function} fn - optional, callback
   * @return self
   * @public
   */
  open(t) {
    if (~this._readyState.indexOf("open"))
      return this;
    this.engine = new ag(this.uri, this.opts);
    const n = this.engine, s = this;
    this._readyState = "opening", this.skipReconnect = !1;
    const i = Jt(n, "open", function() {
      s.onopen(), t && t();
    }), r = (a) => {
      this.cleanup(), this._readyState = "closed", this.emitReserved("error", a), t ? t(a) : this.maybeReconnectOnOpen();
    }, o = Jt(n, "error", r);
    if (this._timeout !== !1) {
      const a = this._timeout, l = this.setTimeoutFn(() => {
        i(), r(new Error("timeout")), n.close();
      }, a);
      this.opts.autoUnref && l.unref(), this.subs.push(() => {
        this.clearTimeoutFn(l);
      });
    }
    return this.subs.push(i), this.subs.push(o), this;
  }
  /**
   * Alias for open()
   *
   * @return self
   * @public
   */
  connect(t) {
    return this.open(t);
  }
  /**
   * Called upon transport open.
   *
   * @private
   */
  onopen() {
    this.cleanup(), this._readyState = "open", this.emitReserved("open");
    const t = this.engine;
    this.subs.push(
      Jt(t, "ping", this.onping.bind(this)),
      Jt(t, "data", this.ondata.bind(this)),
      Jt(t, "error", this.onerror.bind(this)),
      Jt(t, "close", this.onclose.bind(this)),
      // @ts-ignore
      Jt(this.decoder, "decoded", this.ondecoded.bind(this))
    );
  }
  /**
   * Called upon a ping.
   *
   * @private
   */
  onping() {
    this.emitReserved("ping");
  }
  /**
   * Called with data.
   *
   * @private
   */
  ondata(t) {
    try {
      this.decoder.add(t);
    } catch (n) {
      this.onclose("parse error", n);
    }
  }
  /**
   * Called when parser fully decodes a packet.
   *
   * @private
   */
  ondecoded(t) {
    tr(() => {
      this.emitReserved("packet", t);
    }, this.setTimeoutFn);
  }
  /**
   * Called upon socket error.
   *
   * @private
   */
  onerror(t) {
    this.emitReserved("error", t);
  }
  /**
   * Creates a new socket for the given `nsp`.
   *
   * @return {Socket}
   * @public
   */
  socket(t, n) {
    let s = this.nsps[t];
    return s ? this._autoConnect && !s.active && s.connect() : (s = new jc(this, t, n), this.nsps[t] = s), s;
  }
  /**
   * Called upon a socket close.
   *
   * @param socket
   * @private
   */
  _destroy(t) {
    const n = Object.keys(this.nsps);
    for (const s of n)
      if (this.nsps[s].active)
        return;
    this._close();
  }
  /**
   * Writes a packet.
   *
   * @param packet
   * @private
   */
  _packet(t) {
    const n = this.encoder.encode(t);
    for (let s = 0; s < n.length; s++)
      this.engine.write(n[s], t.options);
  }
  /**
   * Clean up transport subscriptions and packet buffer.
   *
   * @private
   */
  cleanup() {
    this.subs.forEach((t) => t()), this.subs.length = 0, this.decoder.destroy();
  }
  /**
   * Close the current socket.
   *
   * @private
   */
  _close() {
    this.skipReconnect = !0, this._reconnecting = !1, this.onclose("forced close");
  }
  /**
   * Alias for close()
   *
   * @private
   */
  disconnect() {
    return this._close();
  }
  /**
   * Called when:
   *
   * - the low-level engine is closed
   * - the parser encountered a badly formatted packet
   * - all sockets are disconnected
   *
   * @private
   */
  onclose(t, n) {
    var s;
    this.cleanup(), (s = this.engine) === null || s === void 0 || s.close(), this.backoff.reset(), this._readyState = "closed", this.emitReserved("close", t, n), this._reconnection && !this.skipReconnect && this.reconnect();
  }
  /**
   * Attempt a reconnection.
   *
   * @private
   */
  reconnect() {
    if (this._reconnecting || this.skipReconnect)
      return this;
    const t = this;
    if (this.backoff.attempts >= this._reconnectionAttempts)
      this.backoff.reset(), this.emitReserved("reconnect_failed"), this._reconnecting = !1;
    else {
      const n = this.backoff.duration();
      this._reconnecting = !0;
      const s = this.setTimeoutFn(() => {
        t.skipReconnect || (this.emitReserved("reconnect_attempt", t.backoff.attempts), !t.skipReconnect && t.open((i) => {
          i ? (t._reconnecting = !1, t.reconnect(), this.emitReserved("reconnect_error", i)) : t.onreconnect();
        }));
      }, n);
      this.opts.autoUnref && s.unref(), this.subs.push(() => {
        this.clearTimeoutFn(s);
      });
    }
  }
  /**
   * Called upon successful reconnect.
   *
   * @private
   */
  onreconnect() {
    const t = this.backoff.attempts;
    this._reconnecting = !1, this.backoff.reset(), this.emitReserved("reconnect", t);
  }
}
const Rs = {};
function Ci(e, t) {
  typeof e == "object" && (t = e, e = void 0), t = t || {};
  const n = lg(e, t.path || "/socket.io"), s = n.source, i = n.id, r = n.path, o = Rs[i] && r in Rs[i].nsps, a = t.forceNew || t["force new connection"] || t.multiplex === !1 || o;
  let l;
  return a ? l = new io(s, t) : (Rs[i] || (Rs[i] = new io(s, t)), l = Rs[i]), n.query && !t.query && (t.query = n.queryKey), l.socket(n.path, t);
}
Object.assign(Ci, {
  Manager: io,
  Socket: jc,
  io: Ci,
  connect: Ci
});
function bg() {
  const e = ie([]), t = ie(!1), n = ie(""), s = ie(!1), i = ie(!1), r = ie(!1), o = ie("connecting"), a = ie(0), l = 5, d = ie({}), c = ie(null), w = ie("");
  let k = null;
  const D = 6e4, M = () => {
    t.value = !1, k && (clearTimeout(k), k = null);
  }, G = () => {
    t.value = !0, k && clearTimeout(k), k = setTimeout(M, D);
  };
  let H = null, ce = null, ue = null, ge = null, T, L;
  const V = (W) => {
    T = W, W && localStorage.setItem("ctid", W);
  }, K = (W) => {
    L = W;
  }, xe = (W) => {
    var m;
    const st = T || localStorage.getItem("ctid"), p = {};
    st && (p.conversation_token = st), L && (p.widget_id = L);
    try {
      p.page_url = window.parent !== window && ((m = window.parent.location) != null && m.href) ? window.parent.location.href : document.referrer || window.location.href;
    } catch {
      p.page_url = document.referrer || "";
    }
    return H = Ci(`${Ks.WS_URL}/widget`, {
      transports: ["websocket"],
      reconnection: !0,
      reconnectionAttempts: l,
      reconnectionDelay: 1e3,
      auth: Object.keys(p).length > 0 ? p : void 0
    }), H.on("connect", () => {
      o.value = "connected", a.value = 0;
    }), H.on("bot_typing", () => {
      G();
    }), H.on("disconnect", () => {
      M(), o.value === "connected" && (console.log("Socket disconnected, setting connection status to connecting"), o.value = "connecting");
    }), H.on("connect_error", () => {
      a.value++, console.error("Socket connection failed, attempt:", a.value, "connection status:", o.value), a.value >= l && (o.value = "failed");
    }), H.on("chat_response", (v) => {
      if (M(), v.session_id ? (console.log("Captured session_id from chat_response:", v.session_id), w.value = v.session_id) : console.warn("No session_id in chat_response data:", v), v.type === "agent_message") {
        const N = {
          message: v.message,
          message_type: "agent",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          session_id: "",
          agent_name: v.agent_name,
          stream: !0,
          // live reply → client-side typewriter reveal
          attributes: {
            end_chat: v.end_chat,
            end_chat_reason: v.end_chat_reason,
            end_chat_description: v.end_chat_description,
            request_rating: v.request_rating
          }
        };
        v.attachments && Array.isArray(v.attachments) && (N.id = v.message_id, N.attachments = v.attachments.map((R, I) => ({
          id: v.message_id * 1e3 + I,
          filename: R.filename,
          file_url: R.file_url,
          content_type: R.content_type,
          file_size: R.file_size
        }))), e.value.push(N);
      } else v.shopify_output && typeof v.shopify_output == "object" && v.shopify_output.products ? e.value.push({
        message: v.message,
        // Keep the accompanying text message
        message_type: "product",
        // Use 'product' type for rendering
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: "",
        agent_name: v.agent_name,
        // Assign the whole structured object
        shopify_output: v.shopify_output,
        // Remove the old flattened fields (product_id, product_title, etc.)
        attributes: {
          // Keep other attributes if needed
          end_chat: v.end_chat,
          request_rating: v.request_rating
        }
      }) : e.value.push({
        message: v.message,
        message_type: "bot",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: "",
        agent_name: v.agent_name,
        stream: !0,
        // live reply → client-side typewriter reveal
        // Knowledge-base citations (display gated by show_citations in the widget)
        sources: Array.isArray(v.sources) && v.sources.length ? v.sources : void 0,
        attributes: {
          end_chat: v.end_chat,
          end_chat_reason: v.end_chat_reason,
          end_chat_description: v.end_chat_description,
          request_rating: v.request_rating
        }
      });
    }), H.on("handle_taken_over", (v) => {
      e.value.push({
        message: `${v.user_name} joined the conversation`,
        message_type: "system",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: v.session_id
      }), d.value = {
        ...d.value,
        human_agent_name: v.user_name,
        human_agent_profile_pic: v.profile_picture
      }, M(), ce && ce(v);
    }), H.on("session_initialized", (v) => {
      v.session_id && (console.log("Initialized session_id from session_initialized:", v.session_id), w.value = v.session_id);
    }), H.on("error", et), H.on("chat_history", rt), H.on("rating_submitted", fe), H.on("display_form", de), H.on("form_submitted", ae), H.on("workflow_state", Te), H.on("workflow_proceeded", tt), H;
  }, Pe = async () => {
    try {
      return o.value = "connecting", a.value = 0, M(), H && (H.removeAllListeners(), H.disconnect(), H = null), H = xe(""), new Promise((W) => {
        H == null || H.on("connect", () => {
          W(!0);
        }), H == null || H.on("connect_error", () => {
          a.value >= l && W(!1);
        });
      });
    } catch (W) {
      return console.error("Socket initialization failed:", W), o.value = "failed", !1;
    }
  }, Ke = () => (H && H.disconnect(), Pe()), Ce = (W) => {
    ce = W;
  }, ye = (W) => {
    ue = W;
  }, Ye = (W) => {
    ge = W;
  }, et = (W) => {
    M(), n.value = jh(W), s.value = !0, setTimeout(() => {
      s.value = !1, n.value = "";
    }, 5e3);
  }, rt = (W) => {
    if (W.type === "chat_history" && Array.isArray(W.messages)) {
      const st = W.messages.map((p) => {
        var v, N;
        const m = {
          message: p.message,
          message_type: p.message_type,
          created_at: p.created_at,
          session_id: "",
          agent_name: p.agent_name || "",
          user_name: p.user_name || "",
          attributes: p.attributes || {},
          attachments: p.attachments || []
          // Include attachments
        };
        return Array.isArray((v = p.attributes) == null ? void 0 : v.sources) && p.attributes.sources.length && (m.sources = p.attributes.sources), (N = p.attributes) != null && N.shopify_output && typeof p.attributes.shopify_output == "object" ? {
          ...m,
          message_type: "product",
          shopify_output: p.attributes.shopify_output
        } : m;
      });
      e.value = [
        ...st.filter(
          (p) => !e.value.some(
            (m) => m.message === p.message && m.created_at === p.created_at
          )
        ),
        ...e.value
      ];
    }
  }, fe = (W) => {
    W.success && e.value.push({
      message: "Thank you for your feedback!",
      message_type: "system",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: ""
    });
  }, de = (W) => {
    var st;
    console.log("Form display handler in composable:", W), M(), c.value = W.form_data, console.log("Set currentForm in handleDisplayForm:", c.value), ((st = W.form_data) == null ? void 0 : st.form_full_screen) === !0 ? (console.log("Full screen form detected, triggering workflow state callback"), ue && ue({
      type: "form",
      form_data: W.form_data,
      session_id: W.session_id
    })) : e.value.push({
      message: "",
      message_type: "form",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: W.session_id,
      attributes: {
        form_data: W.form_data
      }
    });
  }, ae = (W) => {
    console.log("Form submitted confirmation received, clearing currentForm"), c.value = null, W.success && console.log("Form submitted successfully");
  }, Te = (W) => {
    console.log("Workflow state received in composable:", W), (W.type === "form" || W.type === "display_form") && (console.log("Setting currentForm from workflow state:", W.form_data), c.value = W.form_data), ue && ue(W);
  }, tt = (W) => {
    console.log("Workflow proceeded in composable:", W), ge && ge(W);
  }, oe = async (W, st) => {
    !H || !W || H.emit("submit_rating", {
      rating: W,
      feedback: st
    });
  }, Le = async (W) => {
    var m;
    if (console.log("Submitting form in socket:", W), console.log("Current form in socket:", c.value), console.log("Socket in socket:", H), !H) {
      console.error("No socket available for form submission");
      return;
    }
    if (!W || Object.keys(W).length === 0) {
      console.error("No form data to submit");
      return;
    }
    const p = ((m = c.value) == null ? void 0 : m.form_type) === "contact" ? "submit_contact_info" : "submit_form";
    console.log(`Emitting ${p} event with data:`, W), H.emit(p, {
      form_data: W
    }), c.value = null;
  }, Oe = async () => {
    H && (console.log("Getting workflow state 12"), H.emit("get_workflow_state"));
  }, pt = async () => {
    H && H.emit("proceed_workflow", {});
  }, Re = async (W, st, p = []) => {
    if (!H || !W.trim() && p.length === 0) return;
    const m = {
      message: W,
      message_type: "user",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: ""
    };
    p.length > 0 && (m.attachments = p.map((v, N) => {
      let R = "";
      if (v.content_type.startsWith("image/")) {
        const I = atob(v.content), U = new Array(I.length);
        for (let F = 0; F < I.length; F++)
          U[F] = I.charCodeAt(F);
        const z = new Uint8Array(U), B = new Blob([z], { type: v.content_type });
        R = URL.createObjectURL(B);
      }
      return {
        id: Date.now() * 1e3 + N,
        // Temporary ID
        filename: v.filename,
        file_url: R,
        // Temporary blob URL, will be replaced
        content_type: v.content_type,
        file_size: v.size,
        _isTemporary: !0
        // Flag to identify temporary attachments
      };
    })), e.value.push(m), H.emit("chat", {
      message: W,
      email: st,
      files: p
      // Send files with base64 content
    }), r.value = !0;
  }, ot = () => {
    e.value = [], r.value = !1, w.value = "", M(), c.value = null;
  };
  return {
    messages: e,
    loading: t,
    errorMessage: n,
    showError: s,
    loadingHistory: i,
    hasStartedChat: r,
    connectionStatus: o,
    sendMessage: Re,
    endChat: (W = "CUSTOMER_REQUEST") => new Promise((st) => {
      if (!H || !H.connected) {
        ot(), st();
        return;
      }
      let p = !1;
      const m = () => {
        p || (p = !0, clearTimeout(v), H == null || H.off("chat_ended", m), ot(), st());
      }, v = setTimeout(m, 3e3);
      H.on("chat_ended", m), H.emit("end_chat", { reason: W });
    }),
    loadChatHistory: async () => {
      if (H)
        try {
          i.value = !0, H.emit("get_chat_history");
        } catch (W) {
          console.error("Failed to load chat history:", W);
        } finally {
          i.value = !1;
        }
    },
    connect: Pe,
    reconnect: Ke,
    cleanup: () => {
      M(), H && (H.removeAllListeners(), H.disconnect(), H = null), ce = null, ue = null, ge = null;
    },
    humanAgent: d,
    onTakeover: Ce,
    submitRating: oe,
    currentForm: c,
    submitForm: Le,
    getWorkflowState: Oe,
    proceedWorkflow: pt,
    onWorkflowState: ye,
    onWorkflowProceeded: Ye,
    currentSessionId: w,
    setToken: V,
    setWidgetId: K
  };
}
function wg(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Pr = { exports: {} }, rl;
function kg() {
  return rl || (rl = 1, function(e) {
    (function() {
      function t(f, y, C) {
        return f.call.apply(f.bind, arguments);
      }
      function n(f, y, C) {
        if (!f) throw Error();
        if (2 < arguments.length) {
          var S = Array.prototype.slice.call(arguments, 2);
          return function() {
            var $ = Array.prototype.slice.call(arguments);
            return Array.prototype.unshift.apply($, S), f.apply(y, $);
          };
        }
        return function() {
          return f.apply(y, arguments);
        };
      }
      function s(f, y, C) {
        return s = Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1 ? t : n, s.apply(null, arguments);
      }
      var i = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      function r(f, y) {
        this.a = f, this.o = y || f, this.c = this.o.document;
      }
      var o = !!window.FontFace;
      function a(f, y, C, S) {
        if (y = f.c.createElement(y), C) for (var $ in C) C.hasOwnProperty($) && ($ == "style" ? y.style.cssText = C[$] : y.setAttribute($, C[$]));
        return S && y.appendChild(f.c.createTextNode(S)), y;
      }
      function l(f, y, C) {
        f = f.c.getElementsByTagName(y)[0], f || (f = document.documentElement), f.insertBefore(C, f.lastChild);
      }
      function d(f) {
        f.parentNode && f.parentNode.removeChild(f);
      }
      function c(f, y, C) {
        y = y || [], C = C || [];
        for (var S = f.className.split(/\s+/), $ = 0; $ < y.length; $ += 1) {
          for (var Y = !1, ne = 0; ne < S.length; ne += 1) if (y[$] === S[ne]) {
            Y = !0;
            break;
          }
          Y || S.push(y[$]);
        }
        for (y = [], $ = 0; $ < S.length; $ += 1) {
          for (Y = !1, ne = 0; ne < C.length; ne += 1) if (S[$] === C[ne]) {
            Y = !0;
            break;
          }
          Y || y.push(S[$]);
        }
        f.className = y.join(" ").replace(/\s+/g, " ").replace(/^\s+|\s+$/, "");
      }
      function w(f, y) {
        for (var C = f.className.split(/\s+/), S = 0, $ = C.length; S < $; S++) if (C[S] == y) return !0;
        return !1;
      }
      function k(f) {
        return f.o.location.hostname || f.a.location.hostname;
      }
      function D(f, y, C) {
        function S() {
          be && $ && Y && (be(ne), be = null);
        }
        y = a(f, "link", { rel: "stylesheet", href: y, media: "all" });
        var $ = !1, Y = !0, ne = null, be = C || null;
        o ? (y.onload = function() {
          $ = !0, S();
        }, y.onerror = function() {
          $ = !0, ne = Error("Stylesheet failed to load"), S();
        }) : setTimeout(function() {
          $ = !0, S();
        }, 0), l(f, "head", y);
      }
      function M(f, y, C, S) {
        var $ = f.c.getElementsByTagName("head")[0];
        if ($) {
          var Y = a(f, "script", { src: y }), ne = !1;
          return Y.onload = Y.onreadystatechange = function() {
            ne || this.readyState && this.readyState != "loaded" && this.readyState != "complete" || (ne = !0, C && C(null), Y.onload = Y.onreadystatechange = null, Y.parentNode.tagName == "HEAD" && $.removeChild(Y));
          }, $.appendChild(Y), setTimeout(function() {
            ne || (ne = !0, C && C(Error("Script load timeout")));
          }, S || 5e3), Y;
        }
        return null;
      }
      function G() {
        this.a = 0, this.c = null;
      }
      function H(f) {
        return f.a++, function() {
          f.a--, ue(f);
        };
      }
      function ce(f, y) {
        f.c = y, ue(f);
      }
      function ue(f) {
        f.a == 0 && f.c && (f.c(), f.c = null);
      }
      function ge(f) {
        this.a = f || "-";
      }
      ge.prototype.c = function(f) {
        for (var y = [], C = 0; C < arguments.length; C++) y.push(arguments[C].replace(/[\W_]+/g, "").toLowerCase());
        return y.join(this.a);
      };
      function T(f, y) {
        this.c = f, this.f = 4, this.a = "n";
        var C = (y || "n4").match(/^([nio])([1-9])$/i);
        C && (this.a = C[1], this.f = parseInt(C[2], 10));
      }
      function L(f) {
        return xe(f) + " " + (f.f + "00") + " 300px " + V(f.c);
      }
      function V(f) {
        var y = [];
        f = f.split(/,\s*/);
        for (var C = 0; C < f.length; C++) {
          var S = f[C].replace(/['"]/g, "");
          S.indexOf(" ") != -1 || /^\d/.test(S) ? y.push("'" + S + "'") : y.push(S);
        }
        return y.join(",");
      }
      function K(f) {
        return f.a + f.f;
      }
      function xe(f) {
        var y = "normal";
        return f.a === "o" ? y = "oblique" : f.a === "i" && (y = "italic"), y;
      }
      function Pe(f) {
        var y = 4, C = "n", S = null;
        return f && ((S = f.match(/(normal|oblique|italic)/i)) && S[1] && (C = S[1].substr(0, 1).toLowerCase()), (S = f.match(/([1-9]00|normal|bold)/i)) && S[1] && (/bold/i.test(S[1]) ? y = 7 : /[1-9]00/.test(S[1]) && (y = parseInt(S[1].substr(0, 1), 10)))), C + y;
      }
      function Ke(f, y) {
        this.c = f, this.f = f.o.document.documentElement, this.h = y, this.a = new ge("-"), this.j = y.events !== !1, this.g = y.classes !== !1;
      }
      function Ce(f) {
        f.g && c(f.f, [f.a.c("wf", "loading")]), Ye(f, "loading");
      }
      function ye(f) {
        if (f.g) {
          var y = w(f.f, f.a.c("wf", "active")), C = [], S = [f.a.c("wf", "loading")];
          y || C.push(f.a.c("wf", "inactive")), c(f.f, C, S);
        }
        Ye(f, "inactive");
      }
      function Ye(f, y, C) {
        f.j && f.h[y] && (C ? f.h[y](C.c, K(C)) : f.h[y]());
      }
      function et() {
        this.c = {};
      }
      function rt(f, y, C) {
        var S = [], $;
        for ($ in y) if (y.hasOwnProperty($)) {
          var Y = f.c[$];
          Y && S.push(Y(y[$], C));
        }
        return S;
      }
      function fe(f, y) {
        this.c = f, this.f = y, this.a = a(this.c, "span", { "aria-hidden": "true" }, this.f);
      }
      function de(f) {
        l(f.c, "body", f.a);
      }
      function ae(f) {
        return "display:block;position:absolute;top:-9999px;left:-9999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:" + V(f.c) + ";" + ("font-style:" + xe(f) + ";font-weight:" + (f.f + "00") + ";");
      }
      function Te(f, y, C, S, $, Y) {
        this.g = f, this.j = y, this.a = S, this.c = C, this.f = $ || 3e3, this.h = Y || void 0;
      }
      Te.prototype.start = function() {
        var f = this.c.o.document, y = this, C = i(), S = new Promise(function(ne, be) {
          function Se() {
            i() - C >= y.f ? be() : f.fonts.load(L(y.a), y.h).then(function(Xe) {
              1 <= Xe.length ? ne() : setTimeout(Se, 25);
            }, function() {
              be();
            });
          }
          Se();
        }), $ = null, Y = new Promise(function(ne, be) {
          $ = setTimeout(be, y.f);
        });
        Promise.race([Y, S]).then(function() {
          $ && (clearTimeout($), $ = null), y.g(y.a);
        }, function() {
          y.j(y.a);
        });
      };
      function tt(f, y, C, S, $, Y, ne) {
        this.v = f, this.B = y, this.c = C, this.a = S, this.s = ne || "BESbswy", this.f = {}, this.w = $ || 3e3, this.u = Y || null, this.m = this.j = this.h = this.g = null, this.g = new fe(this.c, this.s), this.h = new fe(this.c, this.s), this.j = new fe(this.c, this.s), this.m = new fe(this.c, this.s), f = new T(this.a.c + ",serif", K(this.a)), f = ae(f), this.g.a.style.cssText = f, f = new T(this.a.c + ",sans-serif", K(this.a)), f = ae(f), this.h.a.style.cssText = f, f = new T("serif", K(this.a)), f = ae(f), this.j.a.style.cssText = f, f = new T("sans-serif", K(this.a)), f = ae(f), this.m.a.style.cssText = f, de(this.g), de(this.h), de(this.j), de(this.m);
      }
      var oe = { D: "serif", C: "sans-serif" }, Le = null;
      function Oe() {
        if (Le === null) {
          var f = /AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent);
          Le = !!f && (536 > parseInt(f[1], 10) || parseInt(f[1], 10) === 536 && 11 >= parseInt(f[2], 10));
        }
        return Le;
      }
      tt.prototype.start = function() {
        this.f.serif = this.j.a.offsetWidth, this.f["sans-serif"] = this.m.a.offsetWidth, this.A = i(), Re(this);
      };
      function pt(f, y, C) {
        for (var S in oe) if (oe.hasOwnProperty(S) && y === f.f[oe[S]] && C === f.f[oe[S]]) return !0;
        return !1;
      }
      function Re(f) {
        var y = f.g.a.offsetWidth, C = f.h.a.offsetWidth, S;
        (S = y === f.f.serif && C === f.f["sans-serif"]) || (S = Oe() && pt(f, y, C)), S ? i() - f.A >= f.w ? Oe() && pt(f, y, C) && (f.u === null || f.u.hasOwnProperty(f.a.c)) ? ut(f, f.v) : ut(f, f.B) : ot(f) : ut(f, f.v);
      }
      function ot(f) {
        setTimeout(s(function() {
          Re(this);
        }, f), 50);
      }
      function ut(f, y) {
        setTimeout(s(function() {
          d(this.g.a), d(this.h.a), d(this.j.a), d(this.m.a), y(this.a);
        }, f), 0);
      }
      function Lt(f, y, C) {
        this.c = f, this.a = y, this.f = 0, this.m = this.j = !1, this.s = C;
      }
      var _t = null;
      Lt.prototype.g = function(f) {
        var y = this.a;
        y.g && c(y.f, [y.a.c("wf", f.c, K(f).toString(), "active")], [y.a.c("wf", f.c, K(f).toString(), "loading"), y.a.c("wf", f.c, K(f).toString(), "inactive")]), Ye(y, "fontactive", f), this.m = !0, W(this);
      }, Lt.prototype.h = function(f) {
        var y = this.a;
        if (y.g) {
          var C = w(y.f, y.a.c("wf", f.c, K(f).toString(), "active")), S = [], $ = [y.a.c("wf", f.c, K(f).toString(), "loading")];
          C || S.push(y.a.c("wf", f.c, K(f).toString(), "inactive")), c(y.f, S, $);
        }
        Ye(y, "fontinactive", f), W(this);
      };
      function W(f) {
        --f.f == 0 && f.j && (f.m ? (f = f.a, f.g && c(f.f, [f.a.c("wf", "active")], [f.a.c("wf", "loading"), f.a.c("wf", "inactive")]), Ye(f, "active")) : ye(f.a));
      }
      function st(f) {
        this.j = f, this.a = new et(), this.h = 0, this.f = this.g = !0;
      }
      st.prototype.load = function(f) {
        this.c = new r(this.j, f.context || this.j), this.g = f.events !== !1, this.f = f.classes !== !1, m(this, new Ke(this.c, f), f);
      };
      function p(f, y, C, S, $) {
        var Y = --f.h == 0;
        (f.f || f.g) && setTimeout(function() {
          var ne = $ || null, be = S || null || {};
          if (C.length === 0 && Y) ye(y.a);
          else {
            y.f += C.length, Y && (y.j = Y);
            var Se, Xe = [];
            for (Se = 0; Se < C.length; Se++) {
              var Me = C[Se], at = be[Me.c], wt = y.a, Ve = Me;
              if (wt.g && c(wt.f, [wt.a.c("wf", Ve.c, K(Ve).toString(), "loading")]), Ye(wt, "fontloading", Ve), wt = null, _t === null) if (window.FontFace) {
                var Ve = /Gecko.*Firefox\/(\d+)/.exec(window.navigator.userAgent), Pt = /OS X.*Version\/10\..*Safari/.exec(window.navigator.userAgent) && /Apple/.exec(window.navigator.vendor);
                _t = Ve ? 42 < parseInt(Ve[1], 10) : !Pt;
              } else _t = !1;
              _t ? wt = new Te(s(y.g, y), s(y.h, y), y.c, Me, y.s, at) : wt = new tt(s(y.g, y), s(y.h, y), y.c, Me, y.s, ne, at), Xe.push(wt);
            }
            for (Se = 0; Se < Xe.length; Se++) Xe[Se].start();
          }
        }, 0);
      }
      function m(f, y, C) {
        var $ = [], S = C.timeout;
        Ce(y);
        var $ = rt(f.a, C, f.c), Y = new Lt(f.c, y, S);
        for (f.h = $.length, y = 0, C = $.length; y < C; y++) $[y].load(function(ne, be, Se) {
          p(f, Y, ne, be, Se);
        });
      }
      function v(f, y) {
        this.c = f, this.a = y;
      }
      v.prototype.load = function(f) {
        function y() {
          if (Y["__mti_fntLst" + S]) {
            var ne = Y["__mti_fntLst" + S](), be = [], Se;
            if (ne) for (var Xe = 0; Xe < ne.length; Xe++) {
              var Me = ne[Xe].fontfamily;
              ne[Xe].fontStyle != null && ne[Xe].fontWeight != null ? (Se = ne[Xe].fontStyle + ne[Xe].fontWeight, be.push(new T(Me, Se))) : be.push(new T(Me));
            }
            f(be);
          } else setTimeout(function() {
            y();
          }, 50);
        }
        var C = this, S = C.a.projectId, $ = C.a.version;
        if (S) {
          var Y = C.c.o;
          M(this.c, (C.a.api || "https://fast.fonts.net/jsapi") + "/" + S + ".js" + ($ ? "?v=" + $ : ""), function(ne) {
            ne ? f([]) : (Y["__MonotypeConfiguration__" + S] = function() {
              return C.a;
            }, y());
          }).id = "__MonotypeAPIScript__" + S;
        } else f([]);
      };
      function N(f, y) {
        this.c = f, this.a = y;
      }
      N.prototype.load = function(f) {
        var y, C, S = this.a.urls || [], $ = this.a.families || [], Y = this.a.testStrings || {}, ne = new G();
        for (y = 0, C = S.length; y < C; y++) D(this.c, S[y], H(ne));
        var be = [];
        for (y = 0, C = $.length; y < C; y++) if (S = $[y].split(":"), S[1]) for (var Se = S[1].split(","), Xe = 0; Xe < Se.length; Xe += 1) be.push(new T(S[0], Se[Xe]));
        else be.push(new T(S[0]));
        ce(ne, function() {
          f(be, Y);
        });
      };
      function R(f, y) {
        f ? this.c = f : this.c = I, this.a = [], this.f = [], this.g = y || "";
      }
      var I = "https://fonts.googleapis.com/css";
      function U(f, y) {
        for (var C = y.length, S = 0; S < C; S++) {
          var $ = y[S].split(":");
          $.length == 3 && f.f.push($.pop());
          var Y = "";
          $.length == 2 && $[1] != "" && (Y = ":"), f.a.push($.join(Y));
        }
      }
      function z(f) {
        if (f.a.length == 0) throw Error("No fonts to load!");
        if (f.c.indexOf("kit=") != -1) return f.c;
        for (var y = f.a.length, C = [], S = 0; S < y; S++) C.push(f.a[S].replace(/ /g, "+"));
        return y = f.c + "?family=" + C.join("%7C"), 0 < f.f.length && (y += "&subset=" + f.f.join(",")), 0 < f.g.length && (y += "&text=" + encodeURIComponent(f.g)), y;
      }
      function B(f) {
        this.f = f, this.a = [], this.c = {};
      }
      var F = { latin: "BESbswy", "latin-ext": "çöüğş", cyrillic: "йяЖ", greek: "αβΣ", khmer: "កខគ", Hanuman: "កខគ" }, J = { thin: "1", extralight: "2", "extra-light": "2", ultralight: "2", "ultra-light": "2", light: "3", regular: "4", book: "4", medium: "5", "semi-bold": "6", semibold: "6", "demi-bold": "6", demibold: "6", bold: "7", "extra-bold": "8", extrabold: "8", "ultra-bold": "8", ultrabold: "8", black: "9", heavy: "9", l: "3", r: "4", b: "7" }, q = { i: "i", italic: "i", n: "n", normal: "n" }, Z = /^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/;
      function te(f) {
        for (var y = f.f.length, C = 0; C < y; C++) {
          var S = f.f[C].split(":"), $ = S[0].replace(/\+/g, " "), Y = ["n4"];
          if (2 <= S.length) {
            var ne, be = S[1];
            if (ne = [], be) for (var be = be.split(","), Se = be.length, Xe = 0; Xe < Se; Xe++) {
              var Me;
              if (Me = be[Xe], Me.match(/^[\w-]+$/)) {
                var at = Z.exec(Me.toLowerCase());
                if (at == null) Me = "";
                else {
                  if (Me = at[2], Me = Me == null || Me == "" ? "n" : q[Me], at = at[1], at == null || at == "") at = "4";
                  else var wt = J[at], at = wt || (isNaN(at) ? "4" : at.substr(0, 1));
                  Me = [Me, at].join("");
                }
              } else Me = "";
              Me && ne.push(Me);
            }
            0 < ne.length && (Y = ne), S.length == 3 && (S = S[2], ne = [], S = S ? S.split(",") : ne, 0 < S.length && (S = F[S[0]]) && (f.c[$] = S));
          }
          for (f.c[$] || (S = F[$]) && (f.c[$] = S), S = 0; S < Y.length; S += 1) f.a.push(new T($, Y[S]));
        }
      }
      function re(f, y) {
        this.c = f, this.a = y;
      }
      var me = { Arimo: !0, Cousine: !0, Tinos: !0 };
      re.prototype.load = function(f) {
        var y = new G(), C = this.c, S = new R(this.a.api, this.a.text), $ = this.a.families;
        U(S, $);
        var Y = new B($);
        te(Y), D(C, z(S), H(y)), ce(y, function() {
          f(Y.a, Y.c, me);
        });
      };
      function Ae(f, y) {
        this.c = f, this.a = y;
      }
      Ae.prototype.load = function(f) {
        var y = this.a.id, C = this.c.o;
        y ? M(this.c, (this.a.api || "https://use.typekit.net") + "/" + y + ".js", function(S) {
          if (S) f([]);
          else if (C.Typekit && C.Typekit.config && C.Typekit.config.fn) {
            S = C.Typekit.config.fn;
            for (var $ = [], Y = 0; Y < S.length; Y += 2) for (var ne = S[Y], be = S[Y + 1], Se = 0; Se < be.length; Se++) $.push(new T(ne, be[Se]));
            try {
              C.Typekit.load({ events: !1, classes: !1, async: !0 });
            } catch {
            }
            f($);
          }
        }, 2e3) : f([]);
      };
      function Ne(f, y) {
        this.c = f, this.f = y, this.a = [];
      }
      Ne.prototype.load = function(f) {
        var y = this.f.id, C = this.c.o, S = this;
        y ? (C.__webfontfontdeckmodule__ || (C.__webfontfontdeckmodule__ = {}), C.__webfontfontdeckmodule__[y] = function($, Y) {
          for (var ne = 0, be = Y.fonts.length; ne < be; ++ne) {
            var Se = Y.fonts[ne];
            S.a.push(new T(Se.name, Pe("font-weight:" + Se.weight + ";font-style:" + Se.style)));
          }
          f(S.a);
        }, M(this.c, (this.f.api || "https://f.fontdeck.com/s/css/js/") + k(this.c) + "/" + y + ".js", function($) {
          $ && f([]);
        })) : f([]);
      };
      var je = new st(window);
      je.a.c.custom = function(f, y) {
        return new N(y, f);
      }, je.a.c.fontdeck = function(f, y) {
        return new Ne(y, f);
      }, je.a.c.monotype = function(f, y) {
        return new v(y, f);
      }, je.a.c.typekit = function(f, y) {
        return new Ae(y, f);
      }, je.a.c.google = function(f, y) {
        return new re(y, f);
      };
      var ft = { load: s(je.load, je) };
      e.exports ? e.exports = ft : (window.WebFont = ft, window.WebFontConfig && je.load(window.WebFontConfig));
    })();
  }(Pr)), Pr.exports;
}
var xg = kg();
const Ag = /* @__PURE__ */ wg(xg), ol = [
  "Space Grotesk:400,500,600,700",
  "Instrument Sans:400,500,600",
  "JetBrains Mono:400,500,600"
], Tg = (e) => {
  const t = [...ol], n = (e == null ? void 0 : e.split(",")[0].trim().replace(/['"]/g, "")) || "", s = ol.some(
    (i) => i.toLowerCase().startsWith(n.toLowerCase())
  );
  n && !s && t.push(n), Ag.load({
    google: { families: t },
    active: () => {
      if (!e) return;
      const i = document.querySelector(".chat-container");
      i && (i.style.fontFamily = e.includes(",") ? e : `"${e}", system-ui, sans-serif`);
    }
  });
};
function Sg() {
  const e = ie({}), t = ie(""), n = (i) => {
    var r;
    e.value = i, i.photo_url && (e.value.photo_url = i.photo_url), Tg(i.font_family), window.parent.postMessage({
      type: "CUSTOMIZATION_UPDATE",
      data: {
        chat_bubble_color: i.chat_bubble_color || "#C9F24E",
        chat_style: i.chat_style,
        chat_initiation_messages: i.chat_initiation_messages || [],
        // Dashboard "Widget placement" defaults — the embed loader merges these
        // under any options the installing developer set.
        widget_display: (r = i.customization_metadata) == null ? void 0 : r.widget_display
      }
    }, "*");
  };
  return {
    customization: e,
    agentName: t,
    applyCustomization: n,
    initializeFromData: () => {
      const i = window.__INITIAL_DATA__;
      i && (n(i.customization || {}), t.value = i.agentName || "");
    }
  };
}
const Eg = 13, Cg = 24;
function Rg(e, t) {
  const n = Vi({}), s = [];
  let i = null;
  const r = typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, o = (c) => {
    i || s.length === 0 || (i = setTimeout(a, c));
  }, a = () => {
    i = null;
    const c = s[0];
    if (c === void 0) return;
    const w = e.value[c], k = n[c], D = (w == null ? void 0 : w.message) ?? "";
    if (!k || !w) {
      s.shift(), o(0);
      return;
    }
    if (k.shown >= D.length) {
      k.done = !0, s.shift(), o(0);
      return;
    }
    k.shown += 1;
    const M = D[k.shown - 1];
    t == null || t(), o(M === " " ? Cg : Eg);
  };
  Wt(() => e.value.length, (c, w) => {
    w !== void 0 && c < w && (Object.keys(n).forEach((k) => {
      delete n[Number(k)];
    }), s.length = 0);
    for (let k = w ?? 0; k < c; k++) {
      const D = e.value[k];
      if (!D || !D.stream || k in n) continue;
      const M = D.message ?? "";
      r || !M ? n[k] = { shown: M.length, done: !0 } : (n[k] = { shown: 0, done: !1 }, s.push(k));
    }
    o(0);
  });
  const l = (c, w) => {
    const k = n[c];
    return k ? w.slice(0, k.shown) : w;
  }, d = (c) => {
    const w = n[c];
    return !!w && !w.done;
  };
  return Ys(() => {
    i && clearTimeout(i);
  }), { displayText: l, isStreaming: d };
}
function Ig(e) {
  const t = ie(!0);
  let n = 0;
  const s = () => {
    window.parent.postMessage({ type: "UNREAD_COUNT", count: n }, "*");
  }, i = (r) => {
    var o;
    ((o = r == null ? void 0 : r.data) == null ? void 0 : o.type) === "WIDGET_VISIBILITY" && (t.value = !!r.data.open, t.value && n !== 0 && (n = 0, s()));
  };
  Wt(() => e.value.length, (r, o) => {
    if (r <= (o ?? 0) || t.value) return;
    const a = e.value[r - 1];
    a && (a.message_type === "bot" || a.message_type === "agent") && (n += 1, s());
  }), Yi(() => window.addEventListener("message", i)), Ys(() => window.removeEventListener("message", i));
}
const Lg = {
  light: !1,
  mono: !1,
  radius: 22,
  bubble: 16,
  glow: "rgba(157,140,255,.26)",
  border: "rgba(157,140,255,.32)",
  card: "linear-gradient(180deg,rgba(28,26,40,.94),rgba(15,14,22,.97))",
  text: "#ECEAFA",
  muted: "#9C97BE",
  agentBg: "rgba(255,255,255,.06)",
  accent: "#9D8CFF"
}, Og = {
  light: !1,
  mono: !1,
  radius: 26,
  bubble: 18,
  glow: "rgba(157,140,255,.32)",
  border: "rgba(157,140,255,.40)",
  card: "linear-gradient(180deg,#16131F,#0A0910)",
  text: "#F2F3F8",
  muted: "#A7A0CC",
  agentBg: "rgba(255,255,255,.05)",
  accent: "#9D8CFF"
}, Ng = {
  light: !1,
  mono: !0,
  radius: 8,
  bubble: 4,
  glow: "rgba(201,242,78,.20)",
  border: "rgba(201,242,78,.30)",
  card: "#070907",
  text: "#D7F7C8",
  muted: "#7F9B57",
  agentBg: "rgba(201,242,78,.045)",
  accent: "#C9F24E"
}, Pg = {
  light: !1,
  mono: !1,
  radius: 18,
  bubble: 14,
  glow: "rgba(95,227,214,.22)",
  border: "rgba(95,227,214,.30)",
  card: "linear-gradient(180deg,#0E1A1A,#0A1414)",
  text: "#DDF7F3",
  muted: "#6FAFA8",
  agentBg: "rgba(255,255,255,.05)",
  accent: "#5FE3D6"
}, Mg = {
  light: !0,
  mono: !1,
  radius: 28,
  bubble: 20,
  glow: "rgba(255,138,115,.30)",
  border: "rgba(0,0,0,.07)",
  card: "#FFFFFF",
  text: "#2A2730",
  muted: "#9A93A3",
  agentBg: "#F4F1F6",
  accent: "#FF8A73"
}, Ri = {
  light: !0,
  mono: !1,
  radius: 24,
  bubble: 16,
  glow: "rgba(255,138,115,.22)",
  border: "rgba(0,0,0,.08)",
  card: "#FFFFFF",
  text: "#2A2A33",
  muted: "#8A8A99",
  agentBg: "#F3F3F6",
  accent: "#FF8A73"
}, Fg = {
  GLASS: Lg,
  AURORA: Og,
  TERMINAL: Ng,
  CALM_MINT: Pg,
  PLAYFUL: Mg,
  SUNRISE: Ri,
  CHATBOT: Ri,
  ASK_ANYTHING: Ri
}, Dg = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", al = "'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
function Bg(e) {
  return Math.max(4, Math.round(e * 0.3));
}
function ll(e) {
  const t = (e || "").replace("#", "");
  if (t.length < 6) return "#0B0C10";
  const n = parseInt(t.slice(0, 2), 16), s = parseInt(t.slice(2, 4), 16), i = parseInt(t.slice(4, 6), 16);
  return (0.299 * n + 0.587 * s + 0.114 * i) / 255 > 0.62 ? "#0B0C10" : "#FFFFFF";
}
function $g(e) {
  return Fg[e || ""] || Ri;
}
const Ug = "#212529";
function zg(e, t) {
  const n = $g(e), s = (t == null ? void 0 : t.chat_background_color) || "", i = /^#[0-9a-fA-F]{6}$/.test(s), r = s || n.card, o = (t == null ? void 0 : t.chat_text_color) || "", l = /^#[0-9a-fA-F]{6}$/.test(o) && o.toLowerCase() !== Ug ? o : i ? ls(s) ? "#FFFFFF" : "#111111" : n.text, d = i ? ls(s) ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)" : n.muted, c = i ? Wh(s, 20) : n.agentBg, w = (t == null ? void 0 : t.accent_color) || n.accent, k = i ? !ls(s) : n.light, D = ll(w) === "#0B0C10", M = k === D ? d : w, G = n.mono ? Dg : t != null && t.font_family ? `${t.font_family}, ${al}` : al;
  return {
    "--cm-card": r,
    "--cm-text": l,
    "--cm-muted": d,
    "--cm-agent-bg": c,
    "--cm-accent": w,
    "--cm-on-accent": ll(w),
    "--cm-presence": M,
    "--cm-border": n.border,
    "--cm-glow": n.glow,
    "--cm-radius": `${n.radius}px`,
    "--cm-bubble": `${n.bubble}px`,
    "--cm-bubble-tail": `${Bg(n.bubble)}px`,
    "--cm-field-radius": n.mono ? "7px" : "12px",
    "--cm-avatar-radius": n.mono ? "28%" : "50%",
    "--cm-hairline": n.light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)",
    "--cm-body-font": G
  };
}
function Hg() {
  const e = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    INR: "₹",
    CAD: "CA$",
    AUD: "A$",
    CNY: "¥",
    CHF: "CHF",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    NZD: "NZ$",
    SGD: "S$",
    HKD: "HK$",
    KRW: "₩",
    MXN: "MX$",
    BRL: "R$",
    ZAR: "R",
    RUB: "₽",
    TRY: "₺",
    THB: "฿",
    PLN: "zł",
    AED: "د.إ",
    SAR: "﷼",
    ILS: "₪",
    MYR: "RM"
  };
  return {
    formatCurrency: (s, i) => {
      if (!s && s !== 0) return "";
      const r = i ? e[i] || i : "", o = typeof s == "string" ? s : s.toString();
      return r ? `${r}${o}` : o;
    },
    getCurrencySymbol: (s) => e[s] || s,
    currencySymbols: e
  };
}
const qg = {
  key: 0,
  class: "widget-unavailable-overlay"
}, Wg = {
  key: 1,
  class: "auth-error-overlay"
}, jg = { class: "auth-error-card" }, Vg = { class: "auth-error-message" }, Kg = {
  key: 0,
  class: "initializing-overlay"
}, Gg = {
  key: 0,
  class: "connecting-message"
}, Yg = {
  key: 1,
  class: "failed-message"
}, Xg = { class: "welcome-content" }, Zg = { class: "welcome-header" }, Jg = ["src", "alt"], Qg = { class: "welcome-title" }, em = { class: "welcome-subtitle" }, tm = { class: "welcome-input-container" }, nm = {
  key: 0,
  class: "email-input"
}, sm = ["disabled"], im = { class: "welcome-message-input" }, rm = ["placeholder", "disabled"], om = ["disabled"], am = {
  key: 0,
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, lm = {
  key: 1,
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, cm = { class: "landing-page-content" }, um = { class: "landing-page-header" }, fm = { class: "landing-page-heading" }, hm = { class: "landing-page-text" }, dm = { class: "landing-page-actions" }, pm = { class: "form-fullscreen-content" }, gm = {
  key: 0,
  class: "form-header"
}, mm = {
  key: 0,
  class: "form-title"
}, _m = {
  key: 1,
  class: "form-description"
}, ym = { class: "form-fields" }, vm = ["for"], bm = {
  key: 0,
  class: "required-indicator"
}, wm = ["id", "type", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "onBlur", "autocomplete", "inputmode"], km = ["id", "placeholder", "required", "min", "max", "value", "onInput"], xm = ["id", "placeholder", "required", "minlength", "maxlength", "value", "onInput"], Am = ["id", "required", "value", "onChange"], Tm = { value: "" }, Sm = ["value"], Em = {
  key: 4,
  class: "checkbox-field"
}, Cm = ["id", "required", "checked", "onChange"], Rm = { class: "checkbox-label" }, Im = {
  key: 5,
  class: "radio-group"
}, Lm = ["name", "value", "required", "checked", "onChange"], Om = { class: "radio-label" }, Nm = {
  key: 6,
  class: "field-error"
}, Pm = { class: "form-actions" }, Mm = ["disabled"], Fm = {
  key: 0,
  class: "loading-spinner-inline"
}, Dm = { key: 1 }, Bm = { class: "header-content" }, $m = ["src", "alt"], Um = { class: "header-info" }, zm = { class: "status" }, Hm = { class: "status-text cm-presence" }, qm = { class: "header-actions" }, Wm = ["disabled", "title", "aria-label"], jm = {
  key: 0,
  class: "new-chat-hint"
}, Vm = { class: "ask-anything-header" }, Km = ["src", "alt"], Gm = { class: "header-info" }, Ym = {
  key: 2,
  class: "loading-history"
}, Xm = { class: "cm-email-gate-title" }, Zm = ["disabled"], Jm = {
  key: 0,
  class: "cm-email-gate-error"
}, Qm = ["disabled"], e_ = {
  key: 0,
  class: "cm-welcome-block"
}, t_ = { class: "message agent-message cm-welcome-row" }, n_ = ["src", "alt"], s_ = {
  key: 0,
  class: "cm-msg-avatar",
  "aria-hidden": "true"
}, i_ = ["src"], r_ = ["src"], o_ = { class: "message-col" }, a_ = {
  key: 0,
  class: "rating-content"
}, l_ = { class: "rating-prompt" }, c_ = ["onMouseover", "onMouseleave", "onClick", "disabled"], u_ = {
  key: 0,
  class: "feedback-wrapper"
}, f_ = { class: "feedback-section" }, h_ = ["onUpdate:modelValue", "disabled"], d_ = { class: "feedback-counter" }, p_ = ["onClick", "disabled"], g_ = {
  key: 1,
  class: "submitted-feedback-wrapper"
}, m_ = { class: "submitted-feedback" }, __ = { class: "submitted-feedback-text" }, y_ = {
  key: 2,
  class: "submitted-message"
}, v_ = {
  key: 1,
  class: "form-content"
}, b_ = {
  key: 0,
  class: "form-header"
}, w_ = {
  key: 0,
  class: "form-title"
}, k_ = {
  key: 1,
  class: "form-description"
}, x_ = { class: "form-fields" }, A_ = ["for"], T_ = {
  key: 0,
  class: "required-indicator"
}, S_ = ["id", "type", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "onBlur", "disabled", "autocomplete", "inputmode"], E_ = ["id", "placeholder", "required", "min", "max", "value", "onInput", "disabled"], C_ = ["id", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "disabled"], R_ = ["id", "required", "value", "onChange", "disabled"], I_ = { value: "" }, L_ = ["value"], O_ = {
  key: 4,
  class: "checkbox-field"
}, N_ = ["id", "checked", "onChange", "disabled"], P_ = ["for"], M_ = {
  key: 5,
  class: "radio-field"
}, F_ = ["id", "name", "value", "checked", "onChange", "disabled"], D_ = ["for"], B_ = {
  key: 6,
  class: "field-error"
}, $_ = { class: "form-actions" }, U_ = ["onClick", "disabled"], z_ = {
  key: 2,
  class: "user-input-content"
}, H_ = {
  key: 0,
  class: "user-input-prompt"
}, q_ = {
  key: 1,
  class: "user-input-form"
}, W_ = ["onUpdate:modelValue", "onKeydown"], j_ = ["onClick", "disabled"], V_ = {
  key: 2,
  class: "user-input-submitted"
}, K_ = {
  key: 0,
  class: "user-input-confirmation"
}, G_ = {
  key: 3,
  class: "product-message-container"
}, Y_ = ["innerHTML"], X_ = {
  key: 1,
  class: "products-carousel"
}, Z_ = { class: "carousel-items" }, J_ = {
  key: 0,
  class: "product-image-compact"
}, Q_ = ["src", "alt"], ey = { class: "product-info-compact" }, ty = { class: "product-text-area" }, ny = { class: "product-title-compact" }, sy = {
  key: 0,
  class: "product-variant-compact"
}, iy = { class: "product-price-compact" }, ry = { class: "product-actions-compact" }, oy = ["onClick"], ay = {
  key: 2,
  class: "no-products-message"
}, ly = {
  key: 3,
  class: "no-products-message"
}, cy = ["innerHTML"], uy = ["innerHTML"], fy = {
  key: 2,
  class: "message-attachments"
}, hy = {
  key: 0,
  class: "attachment-image-container"
}, dy = ["src", "alt", "onClick"], py = { class: "attachment-image-info" }, gy = ["href"], my = { class: "attachment-size" }, _y = ["href"], yy = { class: "attachment-size" }, vy = {
  key: 0,
  class: "citation-chips"
}, by = ["title"], wy = { class: "message-info" }, ky = {
  key: 0,
  class: "agent-name"
}, xy = {
  key: 4,
  class: "cm-quick-actions-bar"
}, Ay = ["disabled", "onClick"], Ty = {
  key: 0,
  class: "file-previews-widget"
}, Sy = {
  class: "file-preview-content-widget",
  style: { cursor: "pointer" }
}, Ey = ["src", "alt", "onClick"], Cy = ["onClick"], Ry = { class: "file-preview-info-widget" }, Iy = { class: "file-preview-name-widget" }, Ly = { class: "file-preview-size-widget" }, Oy = ["onClick"], Ny = {
  key: 1,
  class: "upload-progress-widget"
}, Py = { class: "message-input" }, My = ["placeholder", "disabled"], Fy = ["disabled", "title"], Dy = ["disabled"], By = {
  key: 6,
  class: "new-conversation-section"
}, $y = { class: "conversation-ended-message" }, Uy = {
  key: 8,
  class: "rating-dialog"
}, zy = { class: "rating-content" }, Hy = { class: "star-rating" }, qy = ["onClick"], Wy = { class: "rating-actions" }, jy = ["disabled"], Vy = {
  key: 0,
  class: "preview-modal-image-container"
}, Ky = ["src", "alt"], Gy = { class: "preview-modal-filename" }, Yy = {
  key: 3,
  class: "widget-loading"
}, Is = "ctid", cl = 3, Xy = "image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls", Zy = /* @__PURE__ */ $l({
  __name: "WidgetBuilder",
  props: {
    widgetId: {},
    token: {},
    initialAuthError: {}
  },
  setup(e) {
    var Xo;
    const t = e, n = le(() => {
      var h;
      return t.widgetId || ((h = window.__INITIAL_DATA__) == null ? void 0 : h.widgetId);
    }), {
      customization: s,
      agentName: i,
      applyCustomization: r,
      initializeFromData: o
    } = Sg(), { formatCurrency: a } = Hg(), {
      messages: l,
      loading: d,
      errorMessage: c,
      showError: w,
      loadingHistory: k,
      hasStartedChat: D,
      connectionStatus: M,
      sendMessage: G,
      endChat: H,
      loadChatHistory: ce,
      connect: ue,
      reconnect: ge,
      cleanup: T,
      humanAgent: L,
      onTakeover: V,
      submitRating: K,
      submitForm: xe,
      currentForm: Pe,
      getWorkflowState: Ke,
      proceedWorkflow: Ce,
      onWorkflowState: ye,
      onWorkflowProceeded: Ye,
      currentSessionId: et,
      setToken: rt,
      setWidgetId: fe
    } = bg(), { displayText: de, isStreaming: ae } = Rg(l, () => os(() => An()));
    Ig(l);
    const Te = ie(""), tt = ie(!0), oe = ie(""), Le = ie(!1), Oe = (h) => {
      const g = h.target;
      Te.value = g.value;
    };
    let pt = null;
    const Re = () => {
      pt && pt.disconnect(), pt = new MutationObserver((g) => {
        let u = !1, ee = !1;
        g.forEach((ve) => {
          if (ve.type === "childList") {
            const he = Array.from(ve.addedNodes).some(
              (we) => {
                var Yt;
                return we.nodeType === Node.ELEMENT_NODE && (we.matches("input, textarea") || ((Yt = we.querySelector) == null ? void 0 : Yt.call(we, "input, textarea")));
              }
            ), Ge = Array.from(ve.removedNodes).some(
              (we) => {
                var Yt;
                return we.nodeType === Node.ELEMENT_NODE && (we.matches("input, textarea") || ((Yt = we.querySelector) == null ? void 0 : Yt.call(we, "input, textarea")));
              }
            );
            he && (ee = !0, u = !0), Ge && (u = !0);
          }
        }), u && (clearTimeout(Re.timeoutId), Re.timeoutId = setTimeout(() => {
          ut();
        }, ee ? 50 : 100));
      });
      const h = document.querySelector(".widget-container") || document.body;
      pt.observe(h, {
        childList: !0,
        subtree: !0
      });
    };
    Re.timeoutId = null;
    let ot = [];
    const ut = () => {
      Lt();
      const h = [
        '.widget-container input[type="text"]',
        '.chat-container input[type="text"]',
        ".message-input input",
        ".welcome-message-field",
        ".ask-anything-field",
        'input[placeholder*="message"]',
        'input[placeholder*="Type"]',
        'input[placeholder*="Ask"]',
        "input.message-input",
        "textarea",
        // More specific selectors for the widget context
        ".widget-container input",
        ".chat-input input",
        "input"
      ];
      let g = [];
      for (const u of h) {
        const ee = document.querySelectorAll(u);
        if (ee.length > 0) {
          g = Array.from(ee);
          break;
        }
      }
      g.length !== 0 && (ot = g, g.forEach((u) => {
        u.addEventListener("input", W, !0), u.addEventListener("keyup", W, !0), u.addEventListener("change", W, !0), u.addEventListener("keypress", st, !0), u.addEventListener("keydown", p, !0);
      }));
    }, Lt = () => {
      ot.forEach((h) => {
        h.removeEventListener("input", W), h.removeEventListener("keyup", W), h.removeEventListener("change", W), h.removeEventListener("keypress", st), h.removeEventListener("keydown", p);
      }), ot = [];
    }, _t = (h) => !!(h && h.closest && h.closest(".form-message, .form-fullscreen, .cm-email-gate")), W = (h) => {
      if (_t(h.target)) return;
      const g = h.target;
      Te.value = g.value;
    }, st = (h) => {
      _t(h.target) || h.key === "Enter" && !h.shiftKey && (h.preventDefault(), h.stopPropagation(), en());
    }, p = (h) => {
      _t(h.target) || h.key === "Enter" && !h.shiftKey && (h.preventDefault(), h.stopPropagation(), en());
    }, m = (h) => {
      const g = h.target, u = document.querySelector(".header-menu-container");
      document.querySelector(".header-menu-btn");
      const ee = document.querySelector(".header-dropdown-menu");
      ee && !(u != null && u.contains(g)) && (ee.style.display = "none");
    }, v = ie(!0), N = (h) => !h || h === "undefined" || h === "null" || typeof h == "string" && h.trim() === "" ? null : h, R = ie(N(((Xo = window.__INITIAL_DATA__) == null ? void 0 : Xo.initialToken) || localStorage.getItem(Is)));
    le(() => !!R.value);
    const I = ie(null), U = ie(!1), z = ie(!1);
    t.initialAuthError && (I.value = t.initialAuthError, U.value = !0, v.value = !1), o();
    const B = window.__INITIAL_DATA__;
    if (B != null && B.initialToken) {
      const h = N(B.initialToken);
      h && (R.value = h, window.parent.postMessage({
        type: "TOKEN_UPDATE",
        token: h
      }, "*"), Le.value = !0);
    }
    const F = ie(!1);
    (B == null ? void 0 : B.allowAttachments) !== void 0 && (F.value = B.allowAttachments);
    const J = ie(null), {
      chatStyles: q,
      chatIconStyles: Z,
      agentBubbleStyles: te,
      userBubbleStyles: re,
      messageNameStyles: me,
      headerBorderStyles: Ae,
      photoUrl: Ne,
      shadowStyle: je
    } = Ap(s), ft = ie(null), {
      uploadedAttachments: f,
      previewModal: y,
      previewFile: C,
      formatFileSize: S,
      isImageAttachment: $,
      getDownloadUrl: Y,
      getPreviewUrl: ne,
      handleFileSelect: be,
      handleDrop: Se,
      handleDragOver: Xe,
      handleDragLeave: Me,
      handlePaste: at,
      removeAttachment: wt,
      openPreview: Ve,
      closePreview: Pt,
      openFilePicker: Js,
      isImage: fs
    } = Ep(R, ft);
    le(() => l.value.some(
      (h) => h.message_type === "form" && (!h.isSubmitted || h.isSubmitted === !1)
    ));
    const Mt = le(() => {
      var h;
      return D.value && Le.value || !ur.value ? M.value === "connected" && !d.value : ws(oe.value.trim()) && M.value === "connected" && !d.value || ((h = window.__INITIAL_DATA__) == null ? void 0 : h.workflow);
    }), Gn = le(() => M.value === "connected" ? zt.value ? "Ask me anything..." : "Type a message..." : "Connecting..."), en = async () => {
      if (!Te.value.trim() && f.value.length === 0) return;
      !D.value && oe.value && await xn();
      const h = f.value.map((u) => ({
        content: u.content,
        // base64 content
        filename: u.filename,
        content_type: u.type,
        size: u.size
      }));
      await G(Te.value, oe.value, h), f.value.forEach((u) => {
        u.url && u.url.startsWith("blob:") && URL.revokeObjectURL(u.url), u.file_url && u.file_url.startsWith("blob:") && URL.revokeObjectURL(u.file_url);
      }), Te.value = "", f.value = [];
      const g = document.querySelector('input[placeholder*="Type a message"]');
      g && (g.value = ""), setTimeout(() => {
        ut();
      }, 500);
    }, Qs = (h) => {
      Mt.value && (Te.value = h, en());
    }, kt = () => {
      window.parent.postMessage({ type: "WIDGET_MINIMIZE" }, "*");
    }, fn = (h) => {
      h.key === "Enter" && !h.shiftKey && (h.preventDefault(), h.stopPropagation(), en());
    }, xn = async () => {
      var h, g, u, ee;
      try {
        if (!n.value)
          return console.error("Widget ID is not available"), I.value = "Widget ID is not available. Please refresh and try again.", U.value = !0, !1;
        const ve = new URL(`${Ks.API_URL}/widgets/${n.value}`);
        oe.value.trim() && ws(oe.value.trim()) && ve.searchParams.append("email", oe.value.trim());
        const he = {
          Accept: "application/json",
          "Content-Type": "application/json"
        };
        R.value && (he.Authorization = `Bearer ${R.value}`);
        const Ge = await fetch(ve, {
          headers: he
        });
        if (Ge.status === 401) {
          Le.value = !1;
          try {
            const Jn = (await Ge.json()).detail || "";
            (Jn.includes("generate-token") || Jn.includes("API key") || Jn.includes("Token required")) && (z.value = !0, I.value = "Widget authentication not configured. Please contact the website administrator.", U.value = !0, localStorage.removeItem(Is), R.value = null);
          } catch {
            I.value = "Authentication required. Your token has expired or is invalid. Please refresh the page.", U.value = !0, localStorage.removeItem(Is), R.value = null;
          }
          return !1;
        }
        if (!Ge.ok) {
          try {
            const _s = await Ge.json();
            I.value = _s.detail || `Error: ${Ge.statusText}`;
          } catch {
            I.value = `Error: ${Ge.statusText}. Please try again.`;
          }
          return U.value = !0, !1;
        }
        const we = await Ge.json();
        return we.token && (R.value = we.token, localStorage.setItem(Is, we.token), window.parent.postMessage({ type: "TOKEN_UPDATE", token: we.token }, "*")), Le.value = !0, I.value = null, U.value = !1, rt(R.value || void 0), await ue() ? (await ei(), (h = we.agent) != null && h.customization && r(we.agent.customization), we.agent && !(we != null && we.human_agent) && (i.value = we.agent.name), we != null && we.human_agent && (L.value = we.human_agent), ((g = we.agent) == null ? void 0 : g.allow_attachments) !== void 0 && (F.value = we.agent.allow_attachments), ((u = we.agent) == null ? void 0 : u.workflow) !== void 0 && (window.__INITIAL_DATA__ = window.__INITIAL_DATA__ || {}, window.__INITIAL_DATA__.workflow = we.agent.workflow), (ee = we.agent) != null && ee.workflow && await Ke(), !0) : (console.error("Failed to connect to chat service"), I.value = "Failed to connect to chat service. Please try again.", U.value = !0, !1);
      } catch (ve) {
        return console.error("Error checking authorization:", ve), I.value = "An unexpected error occurred. Please try again.", U.value = !0, Le.value = !1, !1;
      } finally {
        v.value = !1;
      }
    }, ei = async () => {
      !D.value && Le.value && (D.value = !0, await ce());
    }, An = () => {
      J.value && (J.value.scrollTop = J.value.scrollHeight);
    };
    Wt(() => l.value, (h) => {
      os(() => {
        An();
      });
    }, { deep: !0 }), Wt(M, (h, g) => {
      h === "connected" && g !== "connected" && setTimeout(ut, 100);
    }), Wt(() => l.value.length, (h, g) => {
      h > 0 && g === 0 && setTimeout(ut, 100);
    });
    let hs = null;
    Wt(() => l.value, (h) => {
      const g = h[h.length - 1];
      !Za(g) || g === hs || (hs = g, ps(g));
    }, { deep: !0 });
    const Gt = async () => {
      await ge() && await xn();
    }, ds = ie(!1), Dn = ie(0), Yn = ie(""), Ft = ie(0), Ut = ie(!1), j = ie({}), _ = ie(!1), P = ie({}), X = ie(!1), $e = ie(null), ht = ie("Start Chat"), Ze = ie(!1), Ue = ie(null);
    le(() => {
      var g;
      const h = l.value[l.value.length - 1];
      return ((g = h == null ? void 0 : h.attributes) == null ? void 0 : g.request_rating) || !1;
    });
    const xt = le(() => {
      var g;
      if (!((g = window.__INITIAL_DATA__) != null && g.workflow))
        return !1;
      const h = l.value.find((u) => u.message_type === "rating");
      return (h == null ? void 0 : h.isSubmitted) === !0;
    }), Dt = le(
      () => Ui(L.value.human_agent_profile_pic)
    ), ps = async (h) => {
      var g, u, ee, ve, he;
      if (Za(h)) {
        try {
          if (h.session_id && R.value && n.value) {
            const Ge = new URL(`${Ks.API_URL}/widgets/${n.value}/end-chat`);
            Ge.searchParams.append("session_id", h.session_id), (g = h.attributes) != null && g.end_chat_reason && Ge.searchParams.append("reason", h.attributes.end_chat_reason), (u = h.attributes) != null && u.end_chat_description && Ge.searchParams.append("description", h.attributes.end_chat_description);
            const we = await fetch(Ge, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${R.value}`,
                "Content-Type": "application/json"
              }
            });
            if (we.ok) {
              const Yt = await we.json();
              console.info(`✓ Chat session closed on backend: ${Yt.session_id}`);
            } else
              console.warn(`Failed to close session on backend: ${we.status}`);
          }
        } catch (Ge) {
          console.error("Error calling end-chat API:", Ge);
        }
        if ((ee = h.attributes) != null && ee.end_chat && ((ve = h.attributes) != null && ve.request_rating)) {
          const Ge = h.agent_name || ((he = L.value) == null ? void 0 : he.human_agent_name) || i.value || "our agent";
          l.value.push({
            message: `Rate the chat session that you had with ${Ge}`,
            message_type: "rating",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            session_id: h.session_id,
            agent_name: Ge,
            showFeedback: !1
          }), et.value = h.session_id;
        }
      }
    }, dt = (h) => {
      Ut.value || (Ft.value = h);
    }, ti = () => {
      if (!Ut.value) {
        const h = l.value[l.value.length - 1];
        Ft.value = (h == null ? void 0 : h.selectedRating) || 0;
      }
    }, ni = async (h) => {
      if (!Ut.value) {
        Ft.value = h;
        const g = l.value[l.value.length - 1];
        g && g.message_type === "rating" && (g.showFeedback = !0, g.selectedRating = h);
      }
    }, Yc = async (h, g, u = null) => {
      try {
        Ut.value = !0, await K(g, u);
        const ee = l.value.find((ve) => ve.message_type === "rating");
        ee && (ee.isSubmitted = !0, ee.finalRating = g, ee.finalFeedback = u);
      } catch (ee) {
        console.error("Failed to submit rating:", ee);
      } finally {
        Ut.value = !1;
      }
    }, Xc = (h) => {
      const g = {};
      for (const u of h.fields) {
        const ee = j.value[u.name], ve = sr(u, ee);
        ve && (g[u.name] = ve);
      }
      return P.value = g, Object.keys(g).length === 0;
    }, Zc = async (h) => {
      if (!(_.value || !Xc(h)))
        try {
          _.value = !0, await xe(j.value);
          const u = l.value.findIndex(
            (ee) => ee.message_type === "form" && (!ee.isSubmitted || ee.isSubmitted === !1)
          );
          u !== -1 && l.value.splice(u, 1), j.value = {}, P.value = {};
        } catch (u) {
          console.error("Failed to submit form:", u);
        } finally {
          _.value = !1;
        }
    }, Ot = (h, g) => {
      var u, ee;
      if (j.value[h] = g, g && g.toString().trim() !== "") {
        let ve = null;
        if ((u = Ue.value) != null && u.fields && (ve = Ue.value.fields.find((he) => he.name === h)), !ve && ((ee = Pe.value) != null && ee.fields) && (ve = Pe.value.fields.find((he) => he.name === h)), ve) {
          const he = sr(ve, g);
          he ? (P.value[h] = he, console.log(`Validation error for ${h}:`, he)) : delete P.value[h];
        }
      } else
        delete P.value[h], console.log(`Cleared error for ${h}`);
    }, Jc = (h) => {
      const g = h.replace(/\D/g, "");
      return g.length >= 7 && g.length <= 15;
    }, sr = (h, g) => {
      if (h.required && (!g || g.toString().trim() === ""))
        return `${h.label} is required`;
      if (!g || g.toString().trim() === "")
        return null;
      if (h.type === "email" && !ws(g))
        return "Please enter a valid email address";
      if (h.type === "tel" && !Jc(g))
        return "Please enter a valid phone number";
      if ((h.type === "text" || h.type === "textarea") && h.minLength && g.length < h.minLength)
        return `${h.label} must be at least ${h.minLength} characters`;
      if ((h.type === "text" || h.type === "textarea") && h.maxLength && g.length > h.maxLength)
        return `${h.label} must not exceed ${h.maxLength} characters`;
      if (h.type === "number") {
        const u = parseFloat(g);
        if (isNaN(u))
          return `${h.label} must be a valid number`;
        if (h.minLength && u < h.minLength)
          return `${h.label} must be at least ${h.minLength}`;
        if (h.maxLength && u > h.maxLength)
          return `${h.label} must not exceed ${h.maxLength}`;
      }
      return null;
    }, Qc = async () => {
      if (!(_.value || !Ue.value))
        try {
          _.value = !0, P.value = {};
          let h = !1;
          for (const g of Ue.value.fields || []) {
            const u = j.value[g.name], ee = sr(g, u);
            ee && (P.value[g.name] = ee, h = !0, console.log(`Validation error for field ${g.name}:`, ee));
          }
          if (h) {
            _.value = !1, console.log("Validation failed, not submitting");
            return;
          }
          await xe(j.value), Ze.value = !1, Ue.value = null, j.value = {};
        } catch (h) {
          console.error("Failed to submit full screen form:", h);
        } finally {
          _.value = !1, console.log("Full screen form submission completed");
        }
    }, eu = (h, g) => {
      if (console.log("handleViewDetails called with:", { product: h, shopDomain: g }), !h) {
        console.error("No product provided to handleViewDetails");
        return;
      }
      let u = null;
      if (h.handle && g)
        u = `https://${g}/products/${h.handle}`;
      else if (h.id && g)
        u = `https://${g}/products/${h.id}`;
      else if (g) {
        if (!h.handle && !h.id) {
          console.error("Product handle and ID are both missing! Product:", h), alert("Unable to open product: Product information incomplete.");
          return;
        }
      } else {
        console.error("Shop domain is missing! Product:", h), alert("Unable to open product: Shop domain not available. Please contact support.");
        return;
      }
      u && (console.log("Opening product URL:", u), window.open(u, "_blank"));
    }, tu = (h) => {
      if (!h) return "";
      let g = h.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "");
      const u = [];
      return g = g.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (ee, ve, he) => {
        const Ge = `__MARKDOWN_LINK_${u.length}__`;
        return console.log("Found markdown link:", ee, "-> placeholder:", Ge), u.push(ee), Ge;
      }), console.log("After replacing markdown links with placeholders:", g), console.log("Markdown links array:", u), g = g.replace(/https?:\/\/[^\s\)]+/g, "[link removed]"), console.log("After removing standalone URLs:", g), u.forEach((ee, ve) => {
        g = g.replace(`__MARKDOWN_LINK_${ve}__`, ee), console.log(`Restored markdown link ${ve}:`, ee);
      }), g = g.replace(/\n\s*\n\s*\n/g, `

`).trim(), g;
    }, Do = ie(!1);
    ie(!1);
    const ir = le(() => {
      var h;
      return !!((h = L.value) != null && h.human_agent_name);
    }), Bo = le(() => {
      var h;
      return kp((h = window.__INITIAL_DATA__) == null ? void 0 : h.presence, ir.value);
    }), nu = le(() => F.value && ir.value && f.value.length < cl), su = async () => {
      try {
        X.value = !1, $e.value = null, await Ce();
      } catch (h) {
        console.error("Failed to proceed workflow:", h);
      }
    }, rr = async (h) => {
      try {
        if (!h.userInputValue || !h.userInputValue.trim())
          return;
        const g = h.userInputValue.trim();
        h.isSubmitted = !0, h.submittedValue = g, await G(g, oe.value);
      } catch (g) {
        console.error("Failed to submit user input:", g), h.isSubmitted = !1, h.submittedValue = null;
      }
    }, or = async () => {
      var h, g, u;
      try {
        let ee = 0;
        const ve = 50;
        for (; !((h = window.__INITIAL_DATA__) != null && h.widgetId) && ee < ve; )
          await new Promise((Ge) => setTimeout(Ge, 100)), ee++;
        return (g = window.__INITIAL_DATA__) != null && g.widgetId ? (fe(window.__INITIAL_DATA__.widgetId), await xn() ? ((u = window.__INITIAL_DATA__) != null && u.workflow && Le.value && await Ke(), !0) : (M.value = "connected", !1)) : (console.error("Widget data not available after waiting"), !1);
      } catch (ee) {
        return console.error("Failed to initialize widget:", ee), !1;
      }
    };
    window.addEventListener("message", (h) => {
      h.source === window.parent && (!h.data || typeof h.data.type != "string" || (h.data.type === "SCROLL_TO_BOTTOM" && An(), h.data.type === "TOKEN_RECEIVED" && localStorage.setItem(Is, h.data.token), h.data.type === "WIDGET_VISIBILITY" && (Go.value = !!h.data.open), h.data.type === "WIDGET_DISPLAY" && (fr.value = {
        mode: h.data.mode,
        width: h.data.width,
        height: h.data.height,
        hotkey: h.data.hotkey
      }), h.data.type === "PREFILL_MESSAGE" && typeof h.data.text == "string" && (Te.value = h.data.text.slice(0, 2e3), os(() => {
        const g = document.querySelector(
          ".message-input input, .welcome-message-field"
        );
        g == null || g.focus();
      }))));
    });
    const iu = () => {
      V(async () => {
        await xn();
      }), ye((h) => {
        var g;
        if (ht.value = h.button_text || "Start Chat", h.type === "landing_page")
          $e.value = h.landing_page_data, X.value = !0, Ze.value = !1;
        else if (h.type === "form" || h.type === "display_form")
          if (((g = h.form_data) == null ? void 0 : g.form_full_screen) === !0)
            Ue.value = h.form_data, Ze.value = !0, X.value = !1;
          else {
            const u = {
              message: "",
              message_type: "form",
              attributes: {
                form_data: h.form_data
              },
              created_at: (/* @__PURE__ */ new Date()).toISOString(),
              isSubmitted: !1
            };
            l.value.findIndex(
              (ve) => ve.message_type === "form" && !ve.isSubmitted
            ) === -1 && l.value.push(u), X.value = !1, Ze.value = !1;
          }
        else
          X.value = !1, Ze.value = !1;
      }), Ye((h) => {
        console.log("Workflow proceeded:", h);
      });
    }, ru = async () => {
      try {
        await or(), await Ke();
      } catch (h) {
        throw console.error("Failed to start new conversation:", h), h;
      }
    }, $o = le(
      () => {
        var h;
        return s.value.allow_new_chat === !0 && l.value.length > 0 && !((h = L.value) != null && h.human_agent_name) && !Bn.value;
      }
    ), Xn = ie(!1), Tn = ie(!1);
    let si = null;
    const ii = () => {
      Tn.value = !1, si && (clearTimeout(si), si = null);
    }, Uo = () => {
      if (!Xn.value) {
        if (!Tn.value) {
          Tn.value = !0, si = setTimeout(ii, 8e3);
          return;
        }
        ii(), ou();
      }
    }, ou = async () => {
      if (!Xn.value) {
        Xn.value = !0;
        try {
          await H(), L.value = {}, Te.value = "", f.value = [], await or();
        } catch (h) {
          console.error("Failed to start a new chat:", h);
        } finally {
          Xn.value = !1;
        }
      }
    }, au = async () => {
      xt.value = !1, l.value = [], L.value = {}, await ru();
    };
    Yi(async () => {
      await or(), iu(), Re(), document.addEventListener("click", m), (() => {
        const g = l.value.length > 0, u = M.value === "connected", ee = document.querySelector('input[type="text"], textarea') !== null;
        return g || u || ee;
      })() && setTimeout(ut, 100);
    }), Ys(() => {
      window.removeEventListener("message", (h) => {
        h.data.type === "SCROLL_TO_BOTTOM" && An();
      }), document.removeEventListener("click", m), pt && (pt.disconnect(), pt = null), Re.timeoutId && (clearTimeout(Re.timeoutId), Re.timeoutId = null), Lt(), T();
    });
    const Zn = le(() => s.value.chat_style === "AURORA"), zt = le(() => s.value.chat_style === "ASK_ANYTHING" || Zn.value), zo = le(() => s.value.customization_metadata), ri = le(() => {
      var g;
      const h = (g = zo.value) == null ? void 0 : g.avatar_style;
      return h === "orb" ? !0 : h === "photo" ? !1 : Zn.value && !s.value.photo_url;
    }), gs = le(() => {
      var h;
      return bp(i.value || "", (h = zo.value) == null ? void 0 : h.orb_variant);
    }), lu = {
      GLASS: "theme-glass",
      TERMINAL: "theme-terminal",
      PLAYFUL: "theme-playful",
      CALM_MINT: "theme-calm",
      SUNRISE: "theme-sunrise"
    }, cu = le(() => lu[s.value.chat_style] || ""), uu = le(() => zg(s.value.chat_style, {
      chat_background_color: s.value.chat_background_color,
      chat_text_color: s.value.chat_text_color,
      accent_color: s.value.accent_color,
      font_family: s.value.font_family
    })), ar = le(
      () => Array.isArray(s.value.quick_actions) ? s.value.quick_actions.filter((h) => !!h && h.trim().length > 0) : []
    ), Ho = le(() => (s.value.welcome_message || "").trim()), qo = le(
      () => !zt.value && l.value.length === 0 && !k.value && !Bn.value
    ), fu = le(
      () => qo.value && Ho.value.length > 0
    ), hu = le(
      () => qo.value && !xt.value && ar.value.length > 0
    ), oi = le(() => s.value.show_citations === !0), Wo = le(() => wp(s.value.show_ai_disclaimer, ir.value)), du = (h) => /^[0-9a-f]{16,}$/i.test(h) || /^[0-9a-f-]{32,}$/i.test(h), lr = (h) => {
      const g = (h || "").trim().toLowerCase();
      return !g || g === "unknown" ? "Knowledge base" : g.charAt(0).toUpperCase() + g.slice(1);
    }, cr = (h) => {
      let g = ((h == null ? void 0 : h.name) || "").trim();
      return !g || (g = g.replace(/^[0-9a-f]{16,}[_-]/i, "").replace(/\.(pdf|txt|md|html?|docx?|csv|json)$/i, ""), !g || du(g)) ? lr(h == null ? void 0 : h.type) : g;
    }, jo = (h) => {
      const g = cr(h), u = lr(h == null ? void 0 : h.type);
      return g === u ? u : `${g} · ${u}`;
    }, ur = le(() => s.value.collect_email === !0 && !zt.value), Vo = ie(!1), Sn = ie(""), ms = ie(!1), Bn = le(() => !D.value && ur.value && !Vo.value), Ko = async () => {
      const h = oe.value.trim();
      if (!h) {
        Sn.value = "Please enter your email address.";
        return;
      }
      if (!ws(h)) {
        Sn.value = "Please enter a valid email address.";
        return;
      }
      Sn.value = "", ms.value = !0;
      try {
        await xn(), Vo.value = !0;
      } catch {
        Sn.value = "Something went wrong. Please try again.";
      } finally {
        ms.value = !1;
      }
    }, fr = ie(null), Go = ie(!0), hr = { mode: "floating", width: 400, height: 560 }, ai = le(
      () => {
        var h;
        return fr.value || ((h = s.value.customization_metadata) == null ? void 0 : h.widget_display) || null;
      }
    ), pu = le(() => {
      const h = ai.value;
      return h ? typeof h.mode == "string" && h.mode !== hr.mode || typeof h.width == "number" && h.width !== hr.width || typeof h.height == "number" && h.height !== hr.height : !1;
    }), gu = le(() => {
      var g;
      const h = {
        width: "100%",
        height: "100%",
        borderRadius: "var(--radius-lg)"
      };
      if (pu.value) {
        const u = (g = ai.value) == null ? void 0 : g.mode;
        return u === "sidebar-left" || u === "sidebar-right" ? { ...h, borderRadius: "0" } : h;
      }
      return zt.value ? window.innerWidth <= 768 ? {
        ...h,
        width: "100vw",
        height: "100vh",
        maxWidth: "100vw",
        maxHeight: "100vh",
        minWidth: "unset",
        borderRadius: "0"
      } : window.innerWidth <= 1024 ? {
        ...h,
        width: "95%",
        maxWidth: "700px",
        minWidth: "500px",
        height: "650px"
      } : {
        ...h,
        width: "100%",
        maxWidth: "400px",
        minWidth: "400px",
        height: "580px"
      } : h;
    }), Yo = le(() => zt.value && l.value.length === 0), mu = ["form", "user_input", "rating", "product", "shopify_output"], _u = le(
      () => l.value.some(
        (h) => mu.includes(h.message_type) || Array.isArray(h.attachments) && h.attachments.length > 0
      )
    ), yu = le(() => {
      var g, u;
      return zt.value ? !0 : (((g = ai.value) == null ? void 0 : g.mode) === "ask-ai" || ((u = ai.value) == null ? void 0 : u.mode) === "search-bar") && !F.value;
    }), dr = le(
      () => yu.value && tt.value && !X.value && !Ze.value && !Bn.value && !xt.value && !_u.value
    );
    Wt(dr, (h) => {
      window.parent.postMessage({ type: "WIDGET_SURFACE", palette: h }, "*");
    }, { immediate: !0 });
    const vu = le(
      () => s.value.welcome_subtitle || `Ask a question — ${i.value || "the assistant"} answers from what it knows.`
    ), bu = le(() => {
      var h;
      return ((h = fr.value) == null ? void 0 : h.hotkey) !== !1;
    });
    return (h, g) => U.value && z.value ? (x(), A("div", qg, [
      b("button", {
        type: "button",
        class: "cm-error-close",
        "aria-label": "Close chat",
        title: "Close",
        onClick: kt
      }, "×"),
      g[20] || (g[20] = zn('<div class="widget-unavailable-card" data-v-6ab0631a><div class="widget-unavailable-icon-wrapper" data-v-6ab0631a><svg class="widget-unavailable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-6ab0631a><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" data-v-6ab0631a></path><path d="M9 12l2 2 4-4" data-v-6ab0631a></path></svg></div><h2 class="widget-unavailable-title" data-v-6ab0631a>Chat Unavailable</h2><p class="widget-unavailable-message" data-v-6ab0631a> This chat widget is not currently configured. Please contact the website administrator to enable chat support. </p><div class="widget-unavailable-footer" data-v-6ab0631a><svg class="chattermate-logo-small" width="14" height="14" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-6ab0631a><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-6ab0631a></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-6ab0631a><span class="cm-powered-prefix" data-v-6ab0631a>Powered by </span><strong class="cm-brand" data-v-6ab0631a>ChatterMate</strong></a></div></div>', 1))
    ])) : U.value ? (x(), A("div", Wg, [
      b("button", {
        type: "button",
        class: "cm-error-close",
        "aria-label": "Close chat",
        title: "Close",
        onClick: kt
      }, "×"),
      b("div", jg, [
        g[21] || (g[21] = zn('<div class="auth-error-header" data-v-6ab0631a><svg class="auth-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-6ab0631a><circle cx="12" cy="12" r="10" data-v-6ab0631a></circle><line x1="12" y1="8" x2="12" y2="12" data-v-6ab0631a></line><line x1="12" y1="16" x2="12.01" y2="16" data-v-6ab0631a></line></svg><h2 data-v-6ab0631a>Authentication Error</h2></div>', 1)),
        b("p", Vg, Q(I.value), 1),
        b("button", {
          class: "auth-error-refresh-btn",
          onClick: g[0] || (g[0] = () => h.window.location.reload())
        }, " Refresh Page ")
      ])
    ])) : n.value && !U.value ? (x(), A("div", {
      key: 2,
      class: Fe(["chat-container cm-surface", [{ collapsed: !tt.value, "ask-anything-style": zt.value, aurora: Zn.value }, cu.value]]),
      style: ke({ ...E(je), ...gu.value, ...uu.value })
    }, [
      v.value ? (x(), A("div", Kg, g[22] || (g[22] = [
        zn('<div class="loading-spinner" data-v-6ab0631a><div class="dot" data-v-6ab0631a></div><div class="dot" data-v-6ab0631a></div><div class="dot" data-v-6ab0631a></div></div><div class="loading-text" data-v-6ab0631a>Initializing chat...</div>', 2)
      ]))) : se("", !0),
      !v.value && E(M) !== "connected" ? (x(), A("div", {
        key: 1,
        class: Fe(["connection-status", E(M)])
      }, [
        E(M) === "connecting" ? (x(), A("div", Gg, g[23] || (g[23] = [
          dn(" Connecting to chat service... ", -1),
          b("div", { class: "loading-dots" }, [
            b("div", { class: "dot" }),
            b("div", { class: "dot" }),
            b("div", { class: "dot" })
          ], -1)
        ]))) : E(M) === "failed" ? (x(), A("div", Yg, [
          g[24] || (g[24] = dn(" Connection failed. ", -1)),
          b("button", {
            onClick: Gt,
            class: "reconnect-button"
          }, " Click here to reconnect ")
        ])) : se("", !0)
      ], 2)) : se("", !0),
      E(w) ? (x(), A("div", {
        key: 2,
        class: "error-alert",
        style: ke(E(Z))
      }, Q(E(c)), 5)) : se("", !0),
      dr.value ? (x(), lc(_p, {
        key: 3,
        messages: E(l),
        draft: Te.value,
        "agent-name": E(i),
        suggestions: ar.value,
        "welcome-title": E(s).welcome_title,
        "welcome-subtitle": vu.value,
        placeholder: Gn.value,
        "input-enabled": Mt.value,
        loading: E(d),
        "show-citations": oi.value,
        disclaimer: Wo.value ? E(Ja) : "",
        active: Go.value,
        hotkey: bu.value,
        "can-start-new-chat": $o.value,
        "starting-new-chat": Xn.value,
        "new-chat-armed": Tn.value,
        onNewChat: Uo,
        onCancelNewChat: ii,
        "citation-label": cr,
        "citation-tooltip": jo,
        "display-text": E(de),
        "is-streaming": E(ae),
        "onUpdate:draft": g[1] || (g[1] = (u) => Te.value = u),
        onSend: en,
        onAsk: Qs,
        onClose: kt
      }, null, 8, ["messages", "draft", "agent-name", "suggestions", "welcome-title", "welcome-subtitle", "placeholder", "input-enabled", "loading", "show-citations", "disclaimer", "active", "hotkey", "can-start-new-chat", "starting-new-chat", "new-chat-armed", "display-text", "is-streaming"])) : Yo.value ? (x(), A("div", {
        key: 4,
        class: Fe(["welcome-message-section", { aurora: Zn.value }]),
        style: ke(E(q))
      }, [
        b("div", Xg, [
          b("div", Zg, [
            ri.value ? (x(), A("div", {
              key: 0,
              class: "welcome-orb",
              style: ke(gs.value)
            }, null, 4)) : E(Ne) ? (x(), A("img", {
              key: 1,
              src: E(Ne),
              alt: E(i),
              class: "welcome-avatar"
            }, null, 8, Jg)) : se("", !0),
            b("h1", Qg, Q(E(s).welcome_title || `Welcome to ${E(i)}`), 1),
            b("p", em, Q(E(s).welcome_subtitle || "I'm here to help you with anything you need. What can I assist you with today?"), 1)
          ])
        ]),
        b("div", tm, [
          !E(D) && !Le.value && ur.value ? (x(), A("div", nm, [
            En(b("input", {
              "onUpdate:modelValue": g[2] || (g[2] = (u) => oe.value = u),
              type: "email",
              placeholder: "Enter your email address",
              disabled: E(d) || E(M) !== "connected",
              class: Fe([{
                invalid: oe.value.trim() && !E(ws)(oe.value.trim()),
                disabled: E(M) !== "connected"
              }, "welcome-email-input"])
            }, null, 10, sm), [
              [Hn, oe.value]
            ])
          ])) : se("", !0),
          b("div", im, [
            En(b("input", {
              "onUpdate:modelValue": g[3] || (g[3] = (u) => Te.value = u),
              type: "text",
              placeholder: Gn.value,
              onKeypress: fn,
              onInput: Oe,
              onChange: Oe,
              disabled: !Mt.value,
              class: Fe([{ disabled: !Mt.value }, "welcome-message-field"])
            }, null, 42, rm), [
              [Hn, Te.value]
            ]),
            b("button", {
              class: Fe(["welcome-send-button", { "aurora-send": Zn.value }]),
              style: ke(E(re)),
              onClick: en,
              disabled: !Te.value.trim() || !Mt.value
            }, [
              Zn.value ? (x(), A("svg", am, g[25] || (g[25] = [
                b("path", {
                  d: "M12 19V5M12 5L5 12M12 5L19 12",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, null, -1)
              ]))) : (x(), A("svg", lm, g[26] || (g[26] = [
                b("path", {
                  d: "M5 12L3 21L21 12L3 3L5 12ZM5 12L13 12",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, null, -1)
              ])))
            ], 14, om)
          ])
        ]),
        b("div", {
          class: "powered-by-welcome",
          style: ke(E(me))
        }, g[27] || (g[27] = [
          zn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-6ab0631a><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-6ab0631a></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-6ab0631a><span class="cm-powered-prefix" data-v-6ab0631a>Powered by </span><strong class="cm-brand" data-v-6ab0631a>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 6)) : se("", !0),
      X.value && $e.value ? (x(), A("div", {
        key: 5,
        class: "landing-page-fullscreen",
        style: ke(E(q))
      }, [
        b("div", cm, [
          b("div", um, [
            b("h2", fm, Q($e.value.heading), 1),
            b("div", hm, Q($e.value.content), 1)
          ]),
          b("div", dm, [
            b("button", {
              class: "landing-page-button",
              onClick: su
            }, Q(ht.value), 1)
          ])
        ]),
        b("div", {
          class: "powered-by-landing",
          style: ke(E(me))
        }, g[28] || (g[28] = [
          zn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-6ab0631a><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-6ab0631a></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-6ab0631a><span class="cm-powered-prefix" data-v-6ab0631a>Powered by </span><strong class="cm-brand" data-v-6ab0631a>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 4)) : Ze.value && Ue.value ? (x(), A("div", {
        key: 6,
        class: "form-fullscreen",
        style: ke(E(q))
      }, [
        b("div", pm, [
          Ue.value.title || Ue.value.description ? (x(), A("div", gm, [
            Ue.value.title ? (x(), A("h2", mm, Q(Ue.value.title), 1)) : se("", !0),
            Ue.value.description ? (x(), A("p", _m, Q(Ue.value.description), 1)) : se("", !0)
          ])) : se("", !0),
          b("div", ym, [
            (x(!0), A(De, null, gt(Ue.value.fields, (u) => {
              var ee, ve;
              return x(), A("div", {
                key: u.name,
                class: "form-field"
              }, [
                b("label", {
                  for: `fullscreen-form-${u.name}`,
                  class: "field-label"
                }, [
                  dn(Q(u.label) + " ", 1),
                  u.required ? (x(), A("span", bm, "*")) : se("", !0)
                ], 8, vm),
                u.type === "text" || u.type === "email" || u.type === "tel" ? (x(), A("input", {
                  key: 0,
                  id: `fullscreen-form-${u.name}`,
                  type: u.type,
                  placeholder: u.placeholder || "",
                  required: u.required,
                  minlength: u.minLength,
                  maxlength: u.maxLength,
                  value: j.value[u.name] || "",
                  onInput: (he) => Ot(u.name, he.target.value),
                  onBlur: (he) => Ot(u.name, he.target.value),
                  class: Fe(["form-input", { error: P.value[u.name] }]),
                  autocomplete: u.type === "email" ? "email" : u.type === "tel" ? "tel" : "off",
                  inputmode: u.type === "tel" ? "tel" : u.type === "email" ? "email" : "text"
                }, null, 42, wm)) : u.type === "number" ? (x(), A("input", {
                  key: 1,
                  id: `fullscreen-form-${u.name}`,
                  type: "number",
                  placeholder: u.placeholder || "",
                  required: u.required,
                  min: u.minLength,
                  max: u.maxLength,
                  value: j.value[u.name] || "",
                  onInput: (he) => Ot(u.name, he.target.value),
                  class: Fe(["form-input", { error: P.value[u.name] }])
                }, null, 42, km)) : u.type === "textarea" ? (x(), A("textarea", {
                  key: 2,
                  id: `fullscreen-form-${u.name}`,
                  placeholder: u.placeholder || "",
                  required: u.required,
                  minlength: u.minLength,
                  maxlength: u.maxLength,
                  value: j.value[u.name] || "",
                  onInput: (he) => Ot(u.name, he.target.value),
                  class: Fe(["form-textarea", { error: P.value[u.name] }]),
                  rows: "4"
                }, null, 42, xm)) : u.type === "select" ? (x(), A("select", {
                  key: 3,
                  id: `fullscreen-form-${u.name}`,
                  required: u.required,
                  value: j.value[u.name] || "",
                  onChange: (he) => Ot(u.name, he.target.value),
                  class: Fe(["form-select", { error: P.value[u.name] }])
                }, [
                  b("option", Tm, Q(u.placeholder || "Please select..."), 1),
                  (x(!0), A(De, null, gt((Array.isArray(u.options) ? u.options : ((ee = u.options) == null ? void 0 : ee.split(`
`)) || []).filter((he) => he.trim()), (he) => (x(), A("option", {
                    key: he,
                    value: he.trim()
                  }, Q(he.trim()), 9, Sm))), 128))
                ], 42, Am)) : u.type === "checkbox" ? (x(), A("label", Em, [
                  b("input", {
                    id: `fullscreen-form-${u.name}`,
                    type: "checkbox",
                    required: u.required,
                    checked: j.value[u.name] || !1,
                    onChange: (he) => Ot(u.name, he.target.checked),
                    class: "form-checkbox"
                  }, null, 40, Cm),
                  b("span", Rm, Q(u.label), 1)
                ])) : u.type === "radio" ? (x(), A("div", Im, [
                  (x(!0), A(De, null, gt((Array.isArray(u.options) ? u.options : ((ve = u.options) == null ? void 0 : ve.split(`
`)) || []).filter((he) => he.trim()), (he) => (x(), A("label", {
                    key: he,
                    class: "radio-field"
                  }, [
                    b("input", {
                      type: "radio",
                      name: `fullscreen-form-${u.name}`,
                      value: he.trim(),
                      required: u.required,
                      checked: j.value[u.name] === he.trim(),
                      onChange: (Ge) => Ot(u.name, he.trim()),
                      class: "form-radio"
                    }, null, 40, Lm),
                    b("span", Om, Q(he.trim()), 1)
                  ]))), 128))
                ])) : se("", !0),
                P.value[u.name] ? (x(), A("div", Nm, Q(P.value[u.name]), 1)) : se("", !0)
              ]);
            }), 128))
          ]),
          b("div", Pm, [
            b("button", {
              onClick: g[4] || (g[4] = () => {
                console.log("Submit button clicked!"), Qc();
              }),
              disabled: _.value,
              class: "submit-form-button",
              style: ke(E(re))
            }, [
              _.value ? (x(), A("span", Fm, g[29] || (g[29] = [
                b("div", { class: "dot" }, null, -1),
                b("div", { class: "dot" }, null, -1),
                b("div", { class: "dot" }, null, -1)
              ]))) : (x(), A("span", Dm, Q(Ue.value.submit_button_text || "Submit"), 1))
            ], 12, Mm)
          ])
        ]),
        b("div", {
          class: "powered-by-landing",
          style: ke(E(me))
        }, g[30] || (g[30] = [
          zn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-6ab0631a><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-6ab0631a></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-6ab0631a><span class="cm-powered-prefix" data-v-6ab0631a>Powered by </span><strong class="cm-brand" data-v-6ab0631a>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 4)) : !Yo.value && tt.value && !dr.value ? (x(), A("div", {
        key: 7,
        class: Fe(["chat-panel", { "ask-anything-chat": zt.value }]),
        style: ke(E(q))
      }, [
        zt.value ? (x(), A("div", {
          key: 1,
          class: "ask-anything-top",
          style: ke(E(Ae))
        }, [
          b("div", Vm, [
            Dt.value || E(Ne) ? (x(), A("img", {
              key: 0,
              src: Dt.value || E(Ne),
              alt: E(L).human_agent_name || E(i),
              class: "header-avatar"
            }, null, 8, Km)) : se("", !0),
            b("div", Gm, [
              b("h3", {
                style: ke(E(me))
              }, Q(E(i)), 5),
              b("p", {
                class: "ask-anything-subtitle",
                style: ke(E(me))
              }, Q(E(s).welcome_subtitle || "Ask me anything. I'm here to help."), 5)
            ])
          ])
        ], 4)) : (x(), A("div", {
          key: 0,
          class: "chat-header",
          style: ke(E(Ae))
        }, [
          b("div", {
            class: "cm-header-sheen",
            style: ke({ background: "linear-gradient(90deg, transparent, " + (E(s).accent_color || "#C9F24E") + ", transparent)" })
          }, null, 4),
          b("div", Bm, [
            !Dt.value && (ri.value || !E(Ne)) ? (x(), A("div", {
              key: 0,
              class: "header-orb",
              style: ke(gs.value)
            }, null, 4)) : Dt.value || E(Ne) ? (x(), A("img", {
              key: 1,
              src: Dt.value || E(Ne),
              alt: E(L).human_agent_name || E(i),
              class: "header-avatar"
            }, null, 8, $m)) : se("", !0),
            b("div", Um, [
              b("h3", {
                style: ke(E(me))
              }, Q(E(L).human_agent_name || E(i)), 5),
              b("div", zm, [
                b("span", {
                  class: Fe(["status-indicator", Bo.value.online ? "online" : "away"])
                }, null, 2),
                b("span", Hm, Q(Bo.value.text), 1)
              ])
            ])
          ]),
          b("div", qm, [
            $o.value ? (x(), A("button", {
              key: 0,
              type: "button",
              class: Fe(["header-new-chat", { armed: Tn.value }]),
              style: ke(E(me)),
              disabled: Xn.value,
              title: Tn.value ? "This ends the current chat — click again to confirm" : "Start a new chat",
              "aria-label": Tn.value ? "Confirm starting a new chat" : "Start a new chat",
              onClick: Uo,
              onBlur: ii
            }, [
              g[31] || (g[31] = b("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2",
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "aria-hidden": "true"
              }, [
                b("path", { d: "M12 20h9" }),
                b("path", { d: "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" })
              ], -1)),
              Tn.value ? (x(), A("span", jm, "Click again to start a new chat")) : se("", !0)
            ], 46, Wm)) : se("", !0),
            b("button", {
              type: "button",
              class: "header-minimize",
              style: ke(E(me)),
              title: "Minimize",
              "aria-label": "Minimize chat",
              onClick: kt
            }, g[32] || (g[32] = [
              b("svg", {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2.5",
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "aria-hidden": "true"
              }, [
                b("path", { d: "M6 9l6 6 6-6" })
              ], -1)
            ]), 4)
          ])
        ], 4)),
        E(k) ? (x(), A("div", Ym, g[33] || (g[33] = [
          b("div", { class: "loading-spinner" }, [
            b("div", { class: "dot" }),
            b("div", { class: "dot" }),
            b("div", { class: "dot" })
          ], -1)
        ]))) : se("", !0),
        Bn.value ? (x(), A("div", {
          key: 3,
          class: "cm-email-gate",
          style: ke(E(q))
        }, [
          b("div", {
            class: "cm-email-gate-orb",
            style: ke(gs.value)
          }, null, 4),
          b("h3", Xm, Q(E(s).welcome_title || "Before we start"), 1),
          g[34] || (g[34] = b("p", { class: "cm-email-gate-text" }, "Enter your email and we'll continue the chat.", -1)),
          En(b("input", {
            "onUpdate:modelValue": g[5] || (g[5] = (u) => oe.value = u),
            type: "email",
            inputmode: "email",
            autocomplete: "email",
            placeholder: "you@example.com",
            class: Fe(["cm-email-gate-input", { invalid: !!Sn.value }]),
            disabled: ms.value,
            onKeyup: wi(Ko, ["enter"]),
            onInput: g[6] || (g[6] = (u) => Sn.value = "")
          }, null, 42, Zm), [
            [Hn, oe.value]
          ]),
          Sn.value ? (x(), A("p", Jm, Q(Sn.value), 1)) : se("", !0),
          b("button", {
            type: "button",
            class: "cm-email-gate-btn",
            style: ke(E(re)),
            disabled: ms.value,
            onClick: Ko
          }, Q(ms.value ? "Please wait…" : "Continue to chat"), 13, Qm)
        ], 4)) : se("", !0),
        En(b("div", {
          class: "chat-messages",
          ref_key: "messagesContainer",
          ref: J
        }, [
          fu.value ? (x(), A("div", e_, [
            b("div", t_, [
              ri.value || !E(Ne) ? (x(), A("div", {
                key: 0,
                class: "cm-welcome-orb",
                style: ke(gs.value)
              }, null, 4)) : (x(), A("img", {
                key: 1,
                src: E(Ne),
                alt: E(i),
                class: "cm-welcome-avatar"
              }, null, 8, n_)),
              b("div", {
                class: "message-bubble cm-welcome-bubble",
                style: ke(E(te))
              }, Q(Ho.value), 5)
            ])
          ])) : se("", !0),
          (x(!0), A(De, null, gt(E(l), (u, ee) => {
            var ve, he, Ge, we, Yt, _s, Jn, Zo, Jo, Qo, ea, ta, na, sa, ia, ra, oa, aa, la;
            return x(), A("div", {
              key: ee,
              class: Fe([
                "message",
                u.message_type === "bot" || u.message_type === "agent" ? "agent-message" : u.message_type === "system" ? "system-message" : u.message_type === "rating" ? "rating-message" : u.message_type === "form" ? "form-message" : u.message_type === "product" || u.shopify_output ? "product-message" : "user-message"
              ])
            }, [
              u.message_type === "bot" || u.message_type === "agent" ? (x(), A("div", s_, [
                Dt.value ? (x(), A("img", {
                  key: 0,
                  src: Dt.value,
                  class: "cm-msg-avatar-img",
                  alt: ""
                }, null, 8, i_)) : !ri.value && E(Ne) ? (x(), A("img", {
                  key: 1,
                  src: E(Ne),
                  class: "cm-msg-avatar-img",
                  alt: ""
                }, null, 8, r_)) : (x(), A("div", {
                  key: 2,
                  class: "cm-msg-avatar-orb",
                  style: ke(gs.value)
                }, null, 4))
              ])) : se("", !0),
              b("div", o_, [
                b("div", {
                  class: "message-bubble",
                  style: ke(u.message_type === "system" || u.message_type === "rating" || u.message_type === "form" || u.message_type === "product" || u.shopify_output ? {} : u.message_type === "user" ? E(re) : E(te))
                }, [
                  u.message_type === "rating" ? (x(), A("div", a_, [
                    b("p", l_, "Rate the chat session that you had with " + Q(u.agent_name || E(L).human_agent_name || E(i) || "our agent"), 1),
                    b("div", {
                      class: Fe(["star-rating", { submitted: Ut.value || u.isSubmitted }])
                    }, [
                      (x(), A(De, null, gt(5, (O) => b("button", {
                        key: O,
                        class: Fe(["star-button", {
                          warning: O <= (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating) && (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating) <= 3,
                          success: O <= (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating) && (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating) > 3,
                          selected: O <= (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating)
                        }]),
                        onMouseover: (Xt) => !u.isSubmitted && dt(O),
                        onMouseleave: (Xt) => !u.isSubmitted && ti,
                        onClick: (Xt) => !u.isSubmitted && ni(O),
                        disabled: Ut.value || u.isSubmitted
                      }, " ★ ", 42, c_)), 64))
                    ], 2),
                    u.showFeedback && !u.isSubmitted ? (x(), A("div", u_, [
                      b("div", f_, [
                        En(b("input", {
                          "onUpdate:modelValue": (O) => u.feedback = O,
                          placeholder: "Please share your feedback (optional)",
                          disabled: Ut.value,
                          maxlength: "500",
                          class: "feedback-input"
                        }, null, 8, h_), [
                          [Hn, u.feedback]
                        ]),
                        b("div", d_, Q(((ve = u.feedback) == null ? void 0 : ve.length) || 0) + "/500", 1)
                      ]),
                      b("button", {
                        onClick: (O) => Yc(u.session_id, Ft.value, u.feedback),
                        disabled: Ut.value || !Ft.value,
                        class: "submit-rating-button",
                        style: ke({ backgroundColor: E(s).accent_color || "var(--accent-solid)" })
                      }, Q(Ut.value ? "Submitting..." : "Submit Rating"), 13, p_)
                    ])) : se("", !0),
                    u.isSubmitted && u.finalFeedback ? (x(), A("div", g_, [
                      b("div", m_, [
                        b("p", __, Q(u.finalFeedback), 1)
                      ])
                    ])) : u.isSubmitted ? (x(), A("div", y_, " Thank you for your rating! ")) : se("", !0)
                  ])) : u.message_type === "form" ? (x(), A("div", v_, [
                    (Ge = (he = u.attributes) == null ? void 0 : he.form_data) != null && Ge.title || (Yt = (we = u.attributes) == null ? void 0 : we.form_data) != null && Yt.description ? (x(), A("div", b_, [
                      (Jn = (_s = u.attributes) == null ? void 0 : _s.form_data) != null && Jn.title ? (x(), A("h3", w_, Q(u.attributes.form_data.title), 1)) : se("", !0),
                      (Jo = (Zo = u.attributes) == null ? void 0 : Zo.form_data) != null && Jo.description ? (x(), A("p", k_, Q(u.attributes.form_data.description), 1)) : se("", !0)
                    ])) : se("", !0),
                    b("div", x_, [
                      (x(!0), A(De, null, gt((ea = (Qo = u.attributes) == null ? void 0 : Qo.form_data) == null ? void 0 : ea.fields, (O) => {
                        var Xt, pr;
                        return x(), A("div", {
                          key: O.name,
                          class: "form-field"
                        }, [
                          b("label", {
                            for: `form-${O.name}`,
                            class: "field-label"
                          }, [
                            dn(Q(O.label) + " ", 1),
                            O.required ? (x(), A("span", T_, "*")) : se("", !0)
                          ], 8, A_),
                          O.type === "text" || O.type === "email" || O.type === "tel" ? (x(), A("input", {
                            key: 0,
                            id: `form-${O.name}`,
                            type: O.type,
                            placeholder: O.placeholder || "",
                            required: O.required,
                            minlength: O.minLength,
                            maxlength: O.maxLength,
                            value: j.value[O.name] || "",
                            onInput: (ze) => Ot(O.name, ze.target.value),
                            onBlur: (ze) => Ot(O.name, ze.target.value),
                            class: Fe(["form-input", { error: P.value[O.name] }]),
                            disabled: _.value,
                            autocomplete: O.type === "email" ? "email" : O.type === "tel" ? "tel" : "off",
                            inputmode: O.type === "tel" ? "tel" : O.type === "email" ? "email" : "text"
                          }, null, 42, S_)) : O.type === "number" ? (x(), A("input", {
                            key: 1,
                            id: `form-${O.name}`,
                            type: "number",
                            placeholder: O.placeholder || "",
                            required: O.required,
                            min: O.min,
                            max: O.max,
                            value: j.value[O.name] || "",
                            onInput: (ze) => Ot(O.name, ze.target.value),
                            class: Fe(["form-input", { error: P.value[O.name] }]),
                            disabled: _.value
                          }, null, 42, E_)) : O.type === "textarea" ? (x(), A("textarea", {
                            key: 2,
                            id: `form-${O.name}`,
                            placeholder: O.placeholder || "",
                            required: O.required,
                            minlength: O.minLength,
                            maxlength: O.maxLength,
                            value: j.value[O.name] || "",
                            onInput: (ze) => Ot(O.name, ze.target.value),
                            class: Fe(["form-textarea", { error: P.value[O.name] }]),
                            disabled: _.value,
                            rows: "3"
                          }, null, 42, C_)) : O.type === "select" ? (x(), A("select", {
                            key: 3,
                            id: `form-${O.name}`,
                            required: O.required,
                            value: j.value[O.name] || "",
                            onChange: (ze) => Ot(O.name, ze.target.value),
                            class: Fe(["form-select", { error: P.value[O.name] }]),
                            disabled: _.value
                          }, [
                            b("option", I_, Q(O.placeholder || "Select an option"), 1),
                            (x(!0), A(De, null, gt((Array.isArray(O.options) ? O.options : ((Xt = O.options) == null ? void 0 : Xt.split(`
`)) || []).filter((ze) => ze.trim()), (ze) => (x(), A("option", {
                              key: ze.trim(),
                              value: ze.trim()
                            }, Q(ze.trim()), 9, L_))), 128))
                          ], 42, R_)) : O.type === "checkbox" ? (x(), A("div", O_, [
                            b("input", {
                              id: `form-${O.name}`,
                              type: "checkbox",
                              checked: j.value[O.name] || !1,
                              onChange: (ze) => Ot(O.name, ze.target.checked),
                              class: "form-checkbox",
                              disabled: _.value
                            }, null, 40, N_),
                            b("label", {
                              for: `form-${O.name}`,
                              class: "checkbox-label"
                            }, Q(O.placeholder || O.label), 9, P_)
                          ])) : O.type === "radio" ? (x(), A("div", M_, [
                            (x(!0), A(De, null, gt((Array.isArray(O.options) ? O.options : ((pr = O.options) == null ? void 0 : pr.split(`
`)) || []).filter((ze) => ze.trim()), (ze) => (x(), A("div", {
                              key: ze.trim(),
                              class: "radio-option"
                            }, [
                              b("input", {
                                id: `form-${O.name}-${ze.trim()}`,
                                name: `form-${O.name}`,
                                type: "radio",
                                value: ze.trim(),
                                checked: j.value[O.name] === ze.trim(),
                                onChange: (nv) => Ot(O.name, ze.trim()),
                                class: "form-radio",
                                disabled: _.value
                              }, null, 40, F_),
                              b("label", {
                                for: `form-${O.name}-${ze.trim()}`,
                                class: "radio-label"
                              }, Q(ze.trim()), 9, D_)
                            ]))), 128))
                          ])) : se("", !0),
                          P.value[O.name] ? (x(), A("div", B_, Q(P.value[O.name]), 1)) : se("", !0)
                        ]);
                      }), 128))
                    ]),
                    b("div", $_, [
                      b("button", {
                        onClick: () => {
                          var O;
                          console.log("Regular form submit button clicked!"), Zc((O = u.attributes) == null ? void 0 : O.form_data);
                        },
                        disabled: _.value,
                        class: "form-submit-button",
                        style: ke(E(re))
                      }, Q(_.value ? "Submitting..." : ((na = (ta = u.attributes) == null ? void 0 : ta.form_data) == null ? void 0 : na.submit_button_text) || "Submit"), 13, U_)
                    ])
                  ])) : u.message_type === "user_input" ? (x(), A("div", z_, [
                    (sa = u.attributes) != null && sa.prompt_message && u.attributes.prompt_message.trim() ? (x(), A("div", H_, Q(u.attributes.prompt_message), 1)) : se("", !0),
                    u.isSubmitted ? (x(), A("div", V_, [
                      g[35] || (g[35] = b("strong", null, "Your input:", -1)),
                      dn(" " + Q(u.submittedValue) + " ", 1),
                      (ia = u.attributes) != null && ia.confirmation_message && u.attributes.confirmation_message.trim() ? (x(), A("div", K_, Q(u.attributes.confirmation_message), 1)) : se("", !0)
                    ])) : (x(), A("div", q_, [
                      En(b("textarea", {
                        "onUpdate:modelValue": (O) => u.userInputValue = O,
                        class: "user-input-textarea",
                        placeholder: "Type your message here...",
                        rows: "3",
                        onKeydown: [
                          wi(Wn((O) => rr(u), ["ctrl"]), ["enter"]),
                          wi(Wn((O) => rr(u), ["meta"]), ["enter"])
                        ]
                      }, null, 40, W_), [
                        [Hn, u.userInputValue]
                      ]),
                      b("button", {
                        class: "user-input-submit-button",
                        onClick: (O) => rr(u),
                        disabled: !u.userInputValue || !u.userInputValue.trim()
                      }, " Submit ", 8, j_)
                    ]))
                  ])) : u.shopify_output || u.message_type === "product" ? (x(), A("div", G_, [
                    u.message ? (x(), A("div", {
                      key: 0,
                      innerHTML: E(Ai)(((oa = (ra = u.shopify_output) == null ? void 0 : ra.products) == null ? void 0 : oa.length) > 0 ? tu(u.message) : u.message),
                      class: "product-message-text"
                    }, null, 8, Y_)) : se("", !0),
                    (aa = u.shopify_output) != null && aa.products && u.shopify_output.products.length > 0 ? (x(), A("div", X_, [
                      g[37] || (g[37] = b("h3", { class: "carousel-title" }, "Products", -1)),
                      b("div", Z_, [
                        (x(!0), A(De, null, gt(u.shopify_output.products, (O) => {
                          var Xt;
                          return x(), A("div", {
                            key: O.id,
                            class: "product-card-compact carousel-item"
                          }, [
                            (Xt = O.image) != null && Xt.src ? (x(), A("div", J_, [
                              b("img", {
                                src: O.image.src,
                                alt: O.title,
                                class: "product-thumbnail"
                              }, null, 8, Q_)
                            ])) : se("", !0),
                            b("div", ey, [
                              b("div", ty, [
                                b("div", ny, Q(O.title), 1),
                                O.variant_title && O.variant_title !== "Default Title" ? (x(), A("div", sy, Q(O.variant_title), 1)) : se("", !0),
                                b("div", iy, Q(O.price_formatted || E(a)(O.price, O.currency)), 1)
                              ]),
                              b("div", ry, [
                                b("button", {
                                  class: "view-details-button-compact",
                                  onClick: (pr) => {
                                    var ze;
                                    return eu(O, (ze = u.shopify_output) == null ? void 0 : ze.shop_domain);
                                  }
                                }, g[36] || (g[36] = [
                                  dn(" View product ", -1),
                                  b("span", { class: "external-link-icon" }, "↗", -1)
                                ]), 8, oy)
                              ])
                            ])
                          ]);
                        }), 128))
                      ])
                    ])) : !u.message && ((la = u.shopify_output) != null && la.products) && u.shopify_output.products.length === 0 ? (x(), A("div", ay, g[38] || (g[38] = [
                      b("p", null, "No products found.", -1)
                    ]))) : !u.message && u.shopify_output && !u.shopify_output.products ? (x(), A("div", ly, g[39] || (g[39] = [
                      b("p", null, "No products to display.", -1)
                    ]))) : se("", !0)
                  ])) : (x(), A(De, { key: 4 }, [
                    E(ae)(ee) ? (x(), A("div", {
                      key: 0,
                      class: "message-streaming",
                      innerHTML: E(Ai)(E(de)(ee, u.message))
                    }, null, 8, cy)) : (x(), A("div", {
                      key: 1,
                      innerHTML: E(Ai)(u.message)
                    }, null, 8, uy)),
                    u.attachments && u.attachments.length > 0 ? (x(), A("div", fy, [
                      (x(!0), A(De, null, gt(u.attachments, (O) => (x(), A("div", {
                        key: O.id,
                        class: "attachment-item"
                      }, [
                        E($)(O.content_type) ? (x(), A("div", hy, [
                          b("img", {
                            src: E(Y)(O.file_url),
                            alt: O.filename,
                            class: "attachment-image",
                            onClick: Wn((Xt) => E(Ve)({ url: O.file_url, filename: O.filename, type: O.content_type, file_url: E(Y)(O.file_url), size: void 0 }), ["stop"]),
                            style: { cursor: "pointer" }
                          }, null, 8, dy),
                          b("div", py, [
                            b("a", {
                              href: E(Y)(O.file_url),
                              target: "_blank",
                              class: "attachment-link"
                            }, [
                              g[40] || (g[40] = b("svg", {
                                width: "14",
                                height: "14",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                "stroke-width": "2",
                                "stroke-linecap": "round",
                                "stroke-linejoin": "round"
                              }, [
                                b("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                                b("polyline", { points: "7 10 12 15 17 10" }),
                                b("line", {
                                  x1: "12",
                                  y1: "15",
                                  x2: "12",
                                  y2: "3"
                                })
                              ], -1)),
                              dn(" " + Q(O.filename) + " ", 1),
                              b("span", my, "(" + Q(E(S)(O.file_size)) + ")", 1)
                            ], 8, gy)
                          ])
                        ])) : (x(), A("a", {
                          key: 1,
                          href: E(Y)(O.file_url),
                          target: "_blank",
                          class: "attachment-link"
                        }, [
                          g[41] || (g[41] = b("svg", {
                            width: "14",
                            height: "14",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            "stroke-width": "2",
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round"
                          }, [
                            b("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" })
                          ], -1)),
                          dn(" " + Q(O.filename) + " ", 1),
                          b("span", yy, "(" + Q(E(S)(O.file_size)) + ")", 1)
                        ], 8, _y))
                      ]))), 128))
                    ])) : se("", !0)
                  ], 64))
                ], 4),
                oi.value && (u.message_type === "bot" || u.message_type === "agent") && u.sources && u.sources.length ? (x(), A("div", vy, [
                  g[42] || (g[42] = b("span", { class: "citation-label" }, "Sources", -1)),
                  (x(!0), A(De, null, gt(u.sources, (O, Xt) => (x(), A("span", {
                    key: Xt,
                    class: "citation-chip",
                    title: jo(O)
                  }, Q(cr(O)), 9, by))), 128))
                ])) : se("", !0),
                b("div", wy, [
                  u.message_type === "user" ? (x(), A("span", ky, " You ")) : se("", !0)
                ])
              ])
            ], 2);
          }), 128)),
          E(d) ? (x(), A("div", {
            key: 1,
            class: Fe(["typing-indicator", { "reading-indicator": oi.value }])
          }, [
            oi.value ? (x(), A(De, { key: 0 }, [
              g[43] || (g[43] = b("div", {
                class: "reading-bars",
                "aria-hidden": "true"
              }, [
                b("span"),
                b("span"),
                b("span")
              ], -1)),
              g[44] || (g[44] = b("span", { class: "reading-label" }, "reading knowledge base", -1))
            ], 64)) : (x(), A("div", {
              key: 1,
              class: "cm-typing-bubble",
              style: ke(E(te))
            }, g[45] || (g[45] = [
              b("span", { class: "cm-typing-dot" }, null, -1),
              b("span", { class: "cm-typing-dot" }, null, -1),
              b("span", { class: "cm-typing-dot" }, null, -1)
            ]), 4))
          ], 2)) : se("", !0)
        ], 512), [
          [wh, !Bn.value]
        ]),
        hu.value ? (x(), A("div", xy, [
          (x(!0), A(De, null, gt(ar.value, (u) => (x(), A("button", {
            key: u,
            type: "button",
            class: "cm-quick-action",
            disabled: !Mt.value,
            onClick: (ee) => Qs(u)
          }, Q(u), 9, Ay))), 128))
        ])) : se("", !0),
        !xt.value && !Bn.value ? (x(), A("div", {
          key: 5,
          class: Fe(["chat-input", { "ask-anything-input": zt.value }])
        }, [
          b("input", {
            ref_key: "fileInputRef",
            ref: ft,
            type: "file",
            accept: Xy,
            multiple: "",
            style: { display: "none" },
            onChange: g[7] || (g[7] = //@ts-ignore
            (...u) => E(be) && E(be)(...u))
          }, null, 544),
          E(f).length > 0 ? (x(), A("div", Ty, [
            (x(!0), A(De, null, gt(E(f), (u, ee) => (x(), A("div", {
              key: ee,
              class: "file-preview-widget"
            }, [
              b("div", Sy, [
                E(fs)(u.type) ? (x(), A("img", {
                  key: 0,
                  src: E(ne)(u),
                  alt: u.filename,
                  class: "file-preview-image-widget",
                  onClick: Wn((ve) => E(Ve)(u), ["stop"]),
                  style: { cursor: "pointer" }
                }, null, 8, Ey)) : (x(), A("div", {
                  key: 1,
                  class: "file-preview-icon-widget",
                  onClick: Wn((ve) => E(Ve)(u), ["stop"]),
                  style: { cursor: "pointer" }
                }, g[46] || (g[46] = [
                  b("svg", {
                    width: "20",
                    height: "20",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    "stroke-width": "2"
                  }, [
                    b("path", { d: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" }),
                    b("polyline", { points: "13 2 13 9 20 9" })
                  ], -1)
                ]), 8, Cy))
              ]),
              b("div", Ry, [
                b("div", Iy, Q(u.filename), 1),
                b("div", Ly, Q(E(S)(u.size)), 1)
              ]),
              b("button", {
                type: "button",
                class: "file-preview-remove-widget",
                onClick: (ve) => E(wt)(ee),
                title: "Remove file"
              }, " × ", 8, Oy)
            ]))), 128))
          ])) : se("", !0),
          Do.value ? (x(), A("div", Ny, g[47] || (g[47] = [
            b("div", { class: "upload-spinner-widget" }, null, -1),
            b("span", { class: "upload-text-widget" }, "Uploading files...", -1)
          ]))) : se("", !0),
          b("div", Py, [
            En(b("input", {
              "onUpdate:modelValue": g[8] || (g[8] = (u) => Te.value = u),
              type: "text",
              placeholder: Gn.value,
              onKeypress: fn,
              onInput: Oe,
              onChange: Oe,
              onPaste: g[9] || (g[9] = //@ts-ignore
              (...u) => E(at) && E(at)(...u)),
              onDrop: g[10] || (g[10] = //@ts-ignore
              (...u) => E(Se) && E(Se)(...u)),
              onDragover: g[11] || (g[11] = //@ts-ignore
              (...u) => E(Xe) && E(Xe)(...u)),
              onDragleave: g[12] || (g[12] = //@ts-ignore
              (...u) => E(Me) && E(Me)(...u)),
              disabled: !Mt.value,
              class: Fe({ disabled: !Mt.value, "ask-anything-field": zt.value })
            }, null, 42, My), [
              [Hn, Te.value]
            ]),
            nu.value ? (x(), A("button", {
              key: 0,
              type: "button",
              class: "attach-button",
              disabled: Do.value,
              onClick: g[13] || (g[13] = //@ts-ignore
              (...u) => E(Js) && E(Js)(...u)),
              title: `Attach files (${E(f).length}/${cl} used) or paste screenshots`
            }, g[48] || (g[48] = [
              b("svg", {
                width: "22",
                height: "22",
                viewBox: "0 0 24 24",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg"
              }, [
                b("path", {
                  d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
                  stroke: "currentColor",
                  "stroke-width": "2.2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                })
              ], -1),
              b("span", { class: "attach-button-glow" }, null, -1)
            ]), 8, Fy)) : se("", !0),
            b("button", {
              class: Fe(["send-button", { "ask-anything-send": zt.value }]),
              style: ke(E(re)),
              onClick: en,
              disabled: !Te.value.trim() && E(f).length === 0 || !Mt.value
            }, g[49] || (g[49] = [
              b("svg", {
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg"
              }, [
                b("path", {
                  d: "M12 19V5M5 12l7-7 7 7",
                  stroke: "currentColor",
                  "stroke-width": "2.2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                })
              ], -1)
            ]), 14, Dy)
          ])
        ], 2)) : xt.value && !Bn.value ? (x(), A("div", By, [
          b("div", $y, [
            g[50] || (g[50] = b("p", { class: "ended-text" }, "This chat has ended.", -1)),
            b("button", {
              class: "start-new-conversation-button",
              style: ke(E(re)),
              onClick: au
            }, " Click here to start a new conversation ", 4)
          ])
        ])) : se("", !0),
        Wo.value ? (x(), A("div", {
          key: 7,
          class: "ai-disclaimer",
          style: ke(E(me))
        }, Q(E(Ja)), 5)) : se("", !0),
        b("div", {
          class: "powered-by",
          style: ke(E(me))
        }, g[51] || (g[51] = [
          zn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-6ab0631a><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-6ab0631a></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-6ab0631a></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-6ab0631a><span class="cm-powered-prefix" data-v-6ab0631a>Powered by </span><strong class="cm-brand" data-v-6ab0631a>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 6)) : se("", !0),
      ds.value ? (x(), A("div", Uy, [
        b("div", zy, [
          g[52] || (g[52] = b("h3", null, "Rate your conversation", -1)),
          b("div", Hy, [
            (x(), A(De, null, gt(5, (u) => b("button", {
              key: u,
              onClick: (ee) => Dn.value = u,
              class: Fe([{ active: u <= Dn.value }, "star-button"])
            }, " ★ ", 10, qy)), 64))
          ]),
          En(b("textarea", {
            "onUpdate:modelValue": g[14] || (g[14] = (u) => Yn.value = u),
            placeholder: "Additional feedback (optional)",
            class: "rating-feedback"
          }, null, 512), [
            [Hn, Yn.value]
          ]),
          b("div", Wy, [
            b("button", {
              onClick: g[15] || (g[15] = (u) => h.submitRating(Dn.value, Yn.value)),
              disabled: !Dn.value,
              class: "submit-button",
              style: ke(E(re))
            }, " Submit ", 12, jy),
            b("button", {
              onClick: g[16] || (g[16] = (u) => ds.value = !1),
              class: "skip-rating"
            }, " Skip ")
          ])
        ])
      ])) : se("", !0),
      E(y) ? (x(), A("div", {
        key: 9,
        class: "preview-modal-overlay",
        onClick: g[19] || (g[19] = //@ts-ignore
        (...u) => E(Pt) && E(Pt)(...u))
      }, [
        b("div", {
          class: "preview-modal-content",
          onClick: g[18] || (g[18] = Wn(() => {
          }, ["stop"]))
        }, [
          b("button", {
            class: "preview-modal-close",
            onClick: g[17] || (g[17] = //@ts-ignore
            (...u) => E(Pt) && E(Pt)(...u))
          }, "×"),
          E(C) && E(fs)(E(C).type) ? (x(), A("div", Vy, [
            b("img", {
              src: E(ne)(E(C)),
              alt: E(C).filename,
              class: "preview-modal-image"
            }, null, 8, Ky),
            b("div", Gy, Q(E(C).filename), 1)
          ])) : se("", !0)
        ])
      ])) : se("", !0)
    ], 6)) : (x(), A("div", Yy));
  }
}), Jy = /* @__PURE__ */ Lc(Zy, [["__scopeId", "data-v-6ab0631a"]]);
window.process || (window.process = { env: { NODE_ENV: "production" } });
const qt = window.__INITIAL_DATA__, Vc = new URL(window.location.href), Kc = Vc.searchParams.get("preview") === "true", Gc = (e) => {
  const t = Vc.searchParams.get(e);
  if (!(!t || t === "undefined" || t.trim() === ""))
    return t;
}, Qy = Kc ? Gc("widget_id") || (qt == null ? void 0 : qt.widgetId) || void 0 : (qt == null ? void 0 : qt.widgetId) || void 0, ev = Kc ? (qt == null ? void 0 : qt.initialToken) || Gc("token") || void 0 : (qt == null ? void 0 : qt.initialToken) || void 0, tv = zh(Jy, {
  widgetId: Qy,
  token: ev || void 0,
  initialAuthError: null
  // Let backend determine if auth is required
});
tv.mount("#app");

var Zc = Object.defineProperty;
var Jc = (t, e, n) => e in t ? Zc(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var Ye = (t, e, n) => Jc(t, typeof e != "symbol" ? e + "" : e, n);
/**
* @vue/shared v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function Wi(t) {
  const e = /* @__PURE__ */ Object.create(null);
  for (const n of t.split(",")) e[n] = 1;
  return (n) => n in e;
}
const Ze = {}, Zn = [], tn = () => {
}, Qc = () => !1, Or = (t) => t.charCodeAt(0) === 111 && t.charCodeAt(1) === 110 && // uppercase letter
(t.charCodeAt(2) > 122 || t.charCodeAt(2) < 97), ji = (t) => t.startsWith("onUpdate:"), At = Object.assign, Vi = (t, e) => {
  const n = t.indexOf(e);
  n > -1 && t.splice(n, 1);
}, eu = Object.prototype.hasOwnProperty, ze = (t, e) => eu.call(t, e), he = Array.isArray, Jn = (t) => Pr(t) === "[object Map]", Ka = (t) => Pr(t) === "[object Set]", ye = (t) => typeof t == "function", gt = (t) => typeof t == "string", Ln = (t) => typeof t == "symbol", lt = (t) => t !== null && typeof t == "object", Ga = (t) => (lt(t) || ye(t)) && ye(t.then) && ye(t.catch), Ya = Object.prototype.toString, Pr = (t) => Ya.call(t), tu = (t) => Pr(t).slice(8, -1), Xa = (t) => Pr(t) === "[object Object]", Ki = (t) => gt(t) && t !== "NaN" && t[0] !== "-" && "" + parseInt(t, 10) === t, Ls = /* @__PURE__ */ Wi(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Nr = (t) => {
  const e = /* @__PURE__ */ Object.create(null);
  return (n) => e[n] || (e[n] = t(n));
}, nu = /-(\w)/g, Cn = Nr(
  (t) => t.replace(nu, (e, n) => n ? n.toUpperCase() : "")
), su = /\B([A-Z])/g, On = Nr(
  (t) => t.replace(su, "-$1").toLowerCase()
), Za = Nr((t) => t.charAt(0).toUpperCase() + t.slice(1)), Qr = Nr(
  (t) => t ? `on${Za(t)}` : ""
), Sn = (t, e) => !Object.is(t, e), cr = (t, ...e) => {
  for (let n = 0; n < t.length; n++)
    t[n](...e);
}, bi = (t, e, n, s = !1) => {
  Object.defineProperty(t, e, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, wi = (t) => {
  const e = parseFloat(t);
  return isNaN(e) ? t : e;
};
let Ko;
const Fr = () => Ko || (Ko = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Ae(t) {
  if (he(t)) {
    const e = {};
    for (let n = 0; n < t.length; n++) {
      const s = t[n], r = gt(s) ? au(s) : Ae(s);
      if (r)
        for (const i in r)
          e[i] = r[i];
    }
    return e;
  } else if (gt(t) || lt(t))
    return t;
}
const ru = /;(?![^(]*\))/g, iu = /:([^]+)/, ou = /\/\*[^]*?\*\//g;
function au(t) {
  const e = {};
  return t.replace(ou, "").split(ru).forEach((n) => {
    if (n) {
      const s = n.split(iu);
      s.length > 1 && (e[s[0].trim()] = s[1].trim());
    }
  }), e;
}
function Xe(t) {
  let e = "";
  if (gt(t))
    e = t;
  else if (he(t))
    for (let n = 0; n < t.length; n++) {
      const s = Xe(t[n]);
      s && (e += s + " ");
    }
  else if (lt(t))
    for (const n in t)
      t[n] && (e += n + " ");
  return e.trim();
}
const lu = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", cu = /* @__PURE__ */ Wi(lu);
function Ja(t) {
  return !!t || t === "";
}
const Qa = (t) => !!(t && t.__v_isRef === !0), re = (t) => gt(t) ? t : t == null ? "" : he(t) || lt(t) && (t.toString === Ya || !ye(t.toString)) ? Qa(t) ? re(t.value) : JSON.stringify(t, el, 2) : String(t), el = (t, e) => Qa(e) ? el(t, e.value) : Jn(e) ? {
  [`Map(${e.size})`]: [...e.entries()].reduce(
    (n, [s, r], i) => (n[ei(s, i) + " =>"] = r, n),
    {}
  )
} : Ka(e) ? {
  [`Set(${e.size})`]: [...e.values()].map((n) => ei(n))
} : Ln(e) ? ei(e) : lt(e) && !he(e) && !Xa(e) ? String(e) : e, ei = (t, e = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Ln(t) ? `Symbol(${(n = t.description) != null ? n : e})` : t
  );
};
/**
* @vue/reactivity v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Ft;
class uu {
  constructor(e = !1) {
    this.detached = e, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this.parent = Ft, !e && Ft && (this.index = (Ft.scopes || (Ft.scopes = [])).push(
      this
    ) - 1);
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let e, n;
      if (this.scopes)
        for (e = 0, n = this.scopes.length; e < n; e++)
          this.scopes[e].pause();
      for (e = 0, n = this.effects.length; e < n; e++)
        this.effects[e].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let e, n;
      if (this.scopes)
        for (e = 0, n = this.scopes.length; e < n; e++)
          this.scopes[e].resume();
      for (e = 0, n = this.effects.length; e < n; e++)
        this.effects[e].resume();
    }
  }
  run(e) {
    if (this._active) {
      const n = Ft;
      try {
        return Ft = this, e();
      } finally {
        Ft = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = Ft, Ft = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    this._on > 0 && --this._on === 0 && (Ft = this.prevScope, this.prevScope = void 0);
  }
  stop(e) {
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
      if (!this.detached && this.parent && !e) {
        const r = this.parent.scopes.pop();
        r && r !== this && (this.parent.scopes[this.index] = r, r.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function fu() {
  return Ft;
}
let tt;
const ti = /* @__PURE__ */ new WeakSet();
class tl {
  constructor(e) {
    this.fn = e, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, Ft && Ft.active && Ft.effects.push(this);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, ti.has(this) && (ti.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || sl(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, Go(this), rl(this);
    const e = tt, n = Yt;
    tt = this, Yt = !0;
    try {
      return this.fn();
    } finally {
      il(this), tt = e, Yt = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let e = this.deps; e; e = e.nextDep)
        Xi(e);
      this.deps = this.depsTail = void 0, Go(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? ti.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    ki(this) && this.run();
  }
  get dirty() {
    return ki(this);
  }
}
let nl = 0, Os, Ps;
function sl(t, e = !1) {
  if (t.flags |= 8, e) {
    t.next = Ps, Ps = t;
    return;
  }
  t.next = Os, Os = t;
}
function Gi() {
  nl++;
}
function Yi() {
  if (--nl > 0)
    return;
  if (Ps) {
    let e = Ps;
    for (Ps = void 0; e; ) {
      const n = e.next;
      e.next = void 0, e.flags &= -9, e = n;
    }
  }
  let t;
  for (; Os; ) {
    let e = Os;
    for (Os = void 0; e; ) {
      const n = e.next;
      if (e.next = void 0, e.flags &= -9, e.flags & 1)
        try {
          e.trigger();
        } catch (s) {
          t || (t = s);
        }
      e = n;
    }
  }
  if (t) throw t;
}
function rl(t) {
  for (let e = t.deps; e; e = e.nextDep)
    e.version = -1, e.prevActiveLink = e.dep.activeLink, e.dep.activeLink = e;
}
function il(t) {
  let e, n = t.depsTail, s = n;
  for (; s; ) {
    const r = s.prevDep;
    s.version === -1 ? (s === n && (n = r), Xi(s), hu(s)) : e = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = r;
  }
  t.deps = e, t.depsTail = n;
}
function ki(t) {
  for (let e = t.deps; e; e = e.nextDep)
    if (e.dep.version !== e.version || e.dep.computed && (ol(e.dep.computed) || e.dep.version !== e.version))
      return !0;
  return !!t._dirty;
}
function ol(t) {
  if (t.flags & 4 && !(t.flags & 16) || (t.flags &= -17, t.globalVersion === $s) || (t.globalVersion = $s, !t.isSSR && t.flags & 128 && (!t.deps && !t._dirty || !ki(t))))
    return;
  t.flags |= 2;
  const e = t.dep, n = tt, s = Yt;
  tt = t, Yt = !0;
  try {
    rl(t);
    const r = t.fn(t._value);
    (e.version === 0 || Sn(r, t._value)) && (t.flags |= 128, t._value = r, e.version++);
  } catch (r) {
    throw e.version++, r;
  } finally {
    tt = n, Yt = s, il(t), t.flags &= -3;
  }
}
function Xi(t, e = !1) {
  const { dep: n, prevSub: s, nextSub: r } = t;
  if (s && (s.nextSub = r, t.prevSub = void 0), r && (r.prevSub = s, t.nextSub = void 0), n.subs === t && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let i = n.computed.deps; i; i = i.nextDep)
      Xi(i, !0);
  }
  !e && !--n.sc && n.map && n.map.delete(n.key);
}
function hu(t) {
  const { prevDep: e, nextDep: n } = t;
  e && (e.nextDep = n, t.prevDep = void 0), n && (n.prevDep = e, t.nextDep = void 0);
}
let Yt = !0;
const al = [];
function _n() {
  al.push(Yt), Yt = !1;
}
function yn() {
  const t = al.pop();
  Yt = t === void 0 ? !0 : t;
}
function Go(t) {
  const { cleanup: e } = t;
  if (t.cleanup = void 0, e) {
    const n = tt;
    tt = void 0;
    try {
      e();
    } finally {
      tt = n;
    }
  }
}
let $s = 0;
class du {
  constructor(e, n) {
    this.sub = e, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Zi {
  // TODO isolatedDeclarations "__v_skip"
  constructor(e) {
    this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(e) {
    if (!tt || !Yt || tt === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== tt)
      n = this.activeLink = new du(tt, this), tt.deps ? (n.prevDep = tt.depsTail, tt.depsTail.nextDep = n, tt.depsTail = n) : tt.deps = tt.depsTail = n, ll(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = tt.depsTail, n.nextDep = void 0, tt.depsTail.nextDep = n, tt.depsTail = n, tt.deps === n && (tt.deps = s);
    }
    return n;
  }
  trigger(e) {
    this.version++, $s++, this.notify(e);
  }
  notify(e) {
    Gi();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      Yi();
    }
  }
}
function ll(t) {
  if (t.dep.sc++, t.sub.flags & 4) {
    const e = t.dep.computed;
    if (e && !t.dep.subs) {
      e.flags |= 20;
      for (let s = e.deps; s; s = s.nextDep)
        ll(s);
    }
    const n = t.dep.subs;
    n !== t && (t.prevSub = n, n && (n.nextSub = t)), t.dep.subs = t;
  }
}
const xi = /* @__PURE__ */ new WeakMap(), Un = Symbol(
  ""
), Ai = Symbol(
  ""
), Us = Symbol(
  ""
);
function kt(t, e, n) {
  if (Yt && tt) {
    let s = xi.get(t);
    s || xi.set(t, s = /* @__PURE__ */ new Map());
    let r = s.get(n);
    r || (s.set(n, r = new Zi()), r.map = s, r.key = n), r.track();
  }
}
function hn(t, e, n, s, r, i) {
  const o = xi.get(t);
  if (!o) {
    $s++;
    return;
  }
  const a = (l) => {
    l && l.trigger();
  };
  if (Gi(), e === "clear")
    o.forEach(a);
  else {
    const l = he(t), h = l && Ki(n);
    if (l && n === "length") {
      const c = Number(s);
      o.forEach((b, m) => {
        (m === "length" || m === Us || !Ln(m) && m >= c) && a(b);
      });
    } else
      switch ((n !== void 0 || o.has(void 0)) && a(o.get(n)), h && a(o.get(Us)), e) {
        case "add":
          l ? h && a(o.get("length")) : (a(o.get(Un)), Jn(t) && a(o.get(Ai)));
          break;
        case "delete":
          l || (a(o.get(Un)), Jn(t) && a(o.get(Ai)));
          break;
        case "set":
          Jn(t) && a(o.get(Un));
          break;
      }
  }
  Yi();
}
function Kn(t) {
  const e = Ue(t);
  return e === t ? e : (kt(e, "iterate", Us), zt(t) ? e : e.map(yt));
}
function Mr(t) {
  return kt(t = Ue(t), "iterate", Us), t;
}
const pu = {
  __proto__: null,
  [Symbol.iterator]() {
    return ni(this, Symbol.iterator, yt);
  },
  concat(...t) {
    return Kn(this).concat(
      ...t.map((e) => he(e) ? Kn(e) : e)
    );
  },
  entries() {
    return ni(this, "entries", (t) => (t[1] = yt(t[1]), t));
  },
  every(t, e) {
    return ln(this, "every", t, e, void 0, arguments);
  },
  filter(t, e) {
    return ln(this, "filter", t, e, (n) => n.map(yt), arguments);
  },
  find(t, e) {
    return ln(this, "find", t, e, yt, arguments);
  },
  findIndex(t, e) {
    return ln(this, "findIndex", t, e, void 0, arguments);
  },
  findLast(t, e) {
    return ln(this, "findLast", t, e, yt, arguments);
  },
  findLastIndex(t, e) {
    return ln(this, "findLastIndex", t, e, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(t, e) {
    return ln(this, "forEach", t, e, void 0, arguments);
  },
  includes(...t) {
    return si(this, "includes", t);
  },
  indexOf(...t) {
    return si(this, "indexOf", t);
  },
  join(t) {
    return Kn(this).join(t);
  },
  // keys() iterator only reads `length`, no optimisation required
  lastIndexOf(...t) {
    return si(this, "lastIndexOf", t);
  },
  map(t, e) {
    return ln(this, "map", t, e, void 0, arguments);
  },
  pop() {
    return gs(this, "pop");
  },
  push(...t) {
    return gs(this, "push", t);
  },
  reduce(t, ...e) {
    return Yo(this, "reduce", t, e);
  },
  reduceRight(t, ...e) {
    return Yo(this, "reduceRight", t, e);
  },
  shift() {
    return gs(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(t, e) {
    return ln(this, "some", t, e, void 0, arguments);
  },
  splice(...t) {
    return gs(this, "splice", t);
  },
  toReversed() {
    return Kn(this).toReversed();
  },
  toSorted(t) {
    return Kn(this).toSorted(t);
  },
  toSpliced(...t) {
    return Kn(this).toSpliced(...t);
  },
  unshift(...t) {
    return gs(this, "unshift", t);
  },
  values() {
    return ni(this, "values", yt);
  }
};
function ni(t, e, n) {
  const s = Mr(t), r = s[e]();
  return s !== t && !zt(t) && (r._next = r.next, r.next = () => {
    const i = r._next();
    return i.value && (i.value = n(i.value)), i;
  }), r;
}
const gu = Array.prototype;
function ln(t, e, n, s, r, i) {
  const o = Mr(t), a = o !== t && !zt(t), l = o[e];
  if (l !== gu[e]) {
    const b = l.apply(t, i);
    return a ? yt(b) : b;
  }
  let h = n;
  o !== t && (a ? h = function(b, m) {
    return n.call(this, yt(b), m, t);
  } : n.length > 2 && (h = function(b, m) {
    return n.call(this, b, m, t);
  }));
  const c = l.call(o, h, s);
  return a && r ? r(c) : c;
}
function Yo(t, e, n, s) {
  const r = Mr(t);
  let i = n;
  return r !== t && (zt(t) ? n.length > 3 && (i = function(o, a, l) {
    return n.call(this, o, a, l, t);
  }) : i = function(o, a, l) {
    return n.call(this, o, yt(a), l, t);
  }), r[e](i, ...s);
}
function si(t, e, n) {
  const s = Ue(t);
  kt(s, "iterate", Us);
  const r = s[e](...n);
  return (r === -1 || r === !1) && eo(n[0]) ? (n[0] = Ue(n[0]), s[e](...n)) : r;
}
function gs(t, e, n = []) {
  _n(), Gi();
  const s = Ue(t)[e].apply(t, n);
  return Yi(), yn(), s;
}
const mu = /* @__PURE__ */ Wi("__proto__,__v_isRef,__isVue"), cl = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((t) => t !== "arguments" && t !== "caller").map((t) => Symbol[t]).filter(Ln)
);
function _u(t) {
  Ln(t) || (t = String(t));
  const e = Ue(this);
  return kt(e, "has", t), e.hasOwnProperty(t);
}
class ul {
  constructor(e = !1, n = !1) {
    this._isReadonly = e, this._isShallow = n;
  }
  get(e, n, s) {
    if (n === "__v_skip") return e.__v_skip;
    const r = this._isReadonly, i = this._isShallow;
    if (n === "__v_isReactive")
      return !r;
    if (n === "__v_isReadonly")
      return r;
    if (n === "__v_isShallow")
      return i;
    if (n === "__v_raw")
      return s === (r ? i ? Eu : pl : i ? dl : hl).get(e) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(e) === Object.getPrototypeOf(s) ? e : void 0;
    const o = he(e);
    if (!r) {
      let l;
      if (o && (l = pu[n]))
        return l;
      if (n === "hasOwnProperty")
        return _u;
    }
    const a = Reflect.get(
      e,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      xt(e) ? e : s
    );
    return (Ln(n) ? cl.has(n) : mu(n)) || (r || kt(e, "get", n), i) ? a : xt(a) ? o && Ki(n) ? a : a.value : lt(a) ? r ? gl(a) : Dr(a) : a;
  }
}
class fl extends ul {
  constructor(e = !1) {
    super(!1, e);
  }
  set(e, n, s, r) {
    let i = e[n];
    if (!this._isShallow) {
      const l = Rn(i);
      if (!zt(s) && !Rn(s) && (i = Ue(i), s = Ue(s)), !he(e) && xt(i) && !xt(s))
        return l ? !1 : (i.value = s, !0);
    }
    const o = he(e) && Ki(n) ? Number(n) < e.length : ze(e, n), a = Reflect.set(
      e,
      n,
      s,
      xt(e) ? e : r
    );
    return e === Ue(r) && (o ? Sn(s, i) && hn(e, "set", n, s) : hn(e, "add", n, s)), a;
  }
  deleteProperty(e, n) {
    const s = ze(e, n);
    e[n];
    const r = Reflect.deleteProperty(e, n);
    return r && s && hn(e, "delete", n, void 0), r;
  }
  has(e, n) {
    const s = Reflect.has(e, n);
    return (!Ln(n) || !cl.has(n)) && kt(e, "has", n), s;
  }
  ownKeys(e) {
    return kt(
      e,
      "iterate",
      he(e) ? "length" : Un
    ), Reflect.ownKeys(e);
  }
}
class yu extends ul {
  constructor(e = !1) {
    super(!0, e);
  }
  set(e, n) {
    return !0;
  }
  deleteProperty(e, n) {
    return !0;
  }
}
const vu = /* @__PURE__ */ new fl(), bu = /* @__PURE__ */ new yu(), wu = /* @__PURE__ */ new fl(!0);
const Ti = (t) => t, tr = (t) => Reflect.getPrototypeOf(t);
function ku(t, e, n) {
  return function(...s) {
    const r = this.__v_raw, i = Ue(r), o = Jn(i), a = t === "entries" || t === Symbol.iterator && o, l = t === "keys" && o, h = r[t](...s), c = n ? Ti : e ? wr : yt;
    return !e && kt(
      i,
      "iterate",
      l ? Ai : Un
    ), {
      // iterator protocol
      next() {
        const { value: b, done: m } = h.next();
        return m ? { value: b, done: m } : {
          value: a ? [c(b[0]), c(b[1])] : c(b),
          done: m
        };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
function nr(t) {
  return function(...e) {
    return t === "delete" ? !1 : t === "clear" ? void 0 : this;
  };
}
function xu(t, e) {
  const n = {
    get(r) {
      const i = this.__v_raw, o = Ue(i), a = Ue(r);
      t || (Sn(r, a) && kt(o, "get", r), kt(o, "get", a));
      const { has: l } = tr(o), h = e ? Ti : t ? wr : yt;
      if (l.call(o, r))
        return h(i.get(r));
      if (l.call(o, a))
        return h(i.get(a));
      i !== o && i.get(r);
    },
    get size() {
      const r = this.__v_raw;
      return !t && kt(Ue(r), "iterate", Un), Reflect.get(r, "size", r);
    },
    has(r) {
      const i = this.__v_raw, o = Ue(i), a = Ue(r);
      return t || (Sn(r, a) && kt(o, "has", r), kt(o, "has", a)), r === a ? i.has(r) : i.has(r) || i.has(a);
    },
    forEach(r, i) {
      const o = this, a = o.__v_raw, l = Ue(a), h = e ? Ti : t ? wr : yt;
      return !t && kt(l, "iterate", Un), a.forEach((c, b) => r.call(i, h(c), h(b), o));
    }
  };
  return At(
    n,
    t ? {
      add: nr("add"),
      set: nr("set"),
      delete: nr("delete"),
      clear: nr("clear")
    } : {
      add(r) {
        !e && !zt(r) && !Rn(r) && (r = Ue(r));
        const i = Ue(this);
        return tr(i).has.call(i, r) || (i.add(r), hn(i, "add", r, r)), this;
      },
      set(r, i) {
        !e && !zt(i) && !Rn(i) && (i = Ue(i));
        const o = Ue(this), { has: a, get: l } = tr(o);
        let h = a.call(o, r);
        h || (r = Ue(r), h = a.call(o, r));
        const c = l.call(o, r);
        return o.set(r, i), h ? Sn(i, c) && hn(o, "set", r, i) : hn(o, "add", r, i), this;
      },
      delete(r) {
        const i = Ue(this), { has: o, get: a } = tr(i);
        let l = o.call(i, r);
        l || (r = Ue(r), l = o.call(i, r)), a && a.call(i, r);
        const h = i.delete(r);
        return l && hn(i, "delete", r, void 0), h;
      },
      clear() {
        const r = Ue(this), i = r.size !== 0, o = r.clear();
        return i && hn(
          r,
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
  ].forEach((r) => {
    n[r] = ku(r, t, e);
  }), n;
}
function Ji(t, e) {
  const n = xu(t, e);
  return (s, r, i) => r === "__v_isReactive" ? !t : r === "__v_isReadonly" ? t : r === "__v_raw" ? s : Reflect.get(
    ze(n, r) && r in s ? n : s,
    r,
    i
  );
}
const Au = {
  get: /* @__PURE__ */ Ji(!1, !1)
}, Tu = {
  get: /* @__PURE__ */ Ji(!1, !0)
}, Su = {
  get: /* @__PURE__ */ Ji(!0, !1)
};
const hl = /* @__PURE__ */ new WeakMap(), dl = /* @__PURE__ */ new WeakMap(), pl = /* @__PURE__ */ new WeakMap(), Eu = /* @__PURE__ */ new WeakMap();
function Cu(t) {
  switch (t) {
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
function Ru(t) {
  return t.__v_skip || !Object.isExtensible(t) ? 0 : Cu(tu(t));
}
function Dr(t) {
  return Rn(t) ? t : Qi(
    t,
    !1,
    vu,
    Au,
    hl
  );
}
function Iu(t) {
  return Qi(
    t,
    !1,
    wu,
    Tu,
    dl
  );
}
function gl(t) {
  return Qi(
    t,
    !0,
    bu,
    Su,
    pl
  );
}
function Qi(t, e, n, s, r) {
  if (!lt(t) || t.__v_raw && !(e && t.__v_isReactive))
    return t;
  const i = Ru(t);
  if (i === 0)
    return t;
  const o = r.get(t);
  if (o)
    return o;
  const a = new Proxy(
    t,
    i === 2 ? s : n
  );
  return r.set(t, a), a;
}
function Qn(t) {
  return Rn(t) ? Qn(t.__v_raw) : !!(t && t.__v_isReactive);
}
function Rn(t) {
  return !!(t && t.__v_isReadonly);
}
function zt(t) {
  return !!(t && t.__v_isShallow);
}
function eo(t) {
  return t ? !!t.__v_raw : !1;
}
function Ue(t) {
  const e = t && t.__v_raw;
  return e ? Ue(e) : t;
}
function Lu(t) {
  return !ze(t, "__v_skip") && Object.isExtensible(t) && bi(t, "__v_skip", !0), t;
}
const yt = (t) => lt(t) ? Dr(t) : t, wr = (t) => lt(t) ? gl(t) : t;
function xt(t) {
  return t ? t.__v_isRef === !0 : !1;
}
function ce(t) {
  return Ou(t, !1);
}
function Ou(t, e) {
  return xt(t) ? t : new Pu(t, e);
}
class Pu {
  constructor(e, n) {
    this.dep = new Zi(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? e : Ue(e), this._value = n ? e : yt(e), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(e) {
    const n = this._rawValue, s = this.__v_isShallow || zt(e) || Rn(e);
    e = s ? e : Ue(e), Sn(e, n) && (this._rawValue = e, this._value = s ? e : yt(e), this.dep.trigger());
  }
}
function E(t) {
  return xt(t) ? t.value : t;
}
const Nu = {
  get: (t, e, n) => e === "__v_raw" ? t : E(Reflect.get(t, e, n)),
  set: (t, e, n, s) => {
    const r = t[e];
    return xt(r) && !xt(n) ? (r.value = n, !0) : Reflect.set(t, e, n, s);
  }
};
function ml(t) {
  return Qn(t) ? t : new Proxy(t, Nu);
}
class Fu {
  constructor(e, n, s) {
    this.fn = e, this.setter = n, this._value = void 0, this.dep = new Zi(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = $s - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    tt !== this)
      return sl(this, !0), !0;
  }
  get value() {
    const e = this.dep.track();
    return ol(this), e && (e.version = this.dep.version), this._value;
  }
  set value(e) {
    this.setter && this.setter(e);
  }
}
function Mu(t, e, n = !1) {
  let s, r;
  return ye(t) ? s = t : (s = t.get, r = t.set), new Fu(s, r, n);
}
const sr = {}, kr = /* @__PURE__ */ new WeakMap();
let $n;
function Du(t, e = !1, n = $n) {
  if (n) {
    let s = kr.get(n);
    s || kr.set(n, s = []), s.push(t);
  }
}
function Bu(t, e, n = Ze) {
  const { immediate: s, deep: r, once: i, scheduler: o, augmentJob: a, call: l } = n, h = (z) => r ? z : zt(z) || r === !1 || r === 0 ? dn(z, 1) : dn(z);
  let c, b, m, P, $ = !1, j = !1;
  if (xt(t) ? (b = () => t.value, $ = zt(t)) : Qn(t) ? (b = () => h(t), $ = !0) : he(t) ? (j = !0, $ = t.some((z) => Qn(z) || zt(z)), b = () => t.map((z) => {
    if (xt(z))
      return z.value;
    if (Qn(z))
      return h(z);
    if (ye(z))
      return l ? l(z, 2) : z();
  })) : ye(t) ? e ? b = l ? () => l(t, 2) : t : b = () => {
    if (m) {
      _n();
      try {
        m();
      } finally {
        yn();
      }
    }
    const z = $n;
    $n = c;
    try {
      return l ? l(t, 3, [P]) : t(P);
    } finally {
      $n = z;
    }
  } : b = tn, e && r) {
    const z = b, W = r === !0 ? 1 / 0 : r;
    b = () => dn(z(), W);
  }
  const Le = fu(), te = () => {
    c.stop(), Le && Le.active && Vi(Le.effects, c);
  };
  if (i && e) {
    const z = e;
    e = (...W) => {
      z(...W), te();
    };
  }
  let Re = j ? new Array(t.length).fill(sr) : sr;
  const xe = (z) => {
    if (!(!(c.flags & 1) || !c.dirty && !z))
      if (e) {
        const W = c.run();
        if (r || $ || (j ? W.some((ne, V) => Sn(ne, Re[V])) : Sn(W, Re))) {
          m && m();
          const ne = $n;
          $n = c;
          try {
            const V = [
              W,
              // pass undefined as the old value when it's changed for the first time
              Re === sr ? void 0 : j && Re[0] === sr ? [] : Re,
              P
            ];
            Re = W, l ? l(e, 3, V) : (
              // @ts-expect-error
              e(...V)
            );
          } finally {
            $n = ne;
          }
        }
      } else
        c.run();
  };
  return a && a(xe), c = new tl(b), c.scheduler = o ? () => o(xe, !1) : xe, P = (z) => Du(z, !1, c), m = c.onStop = () => {
    const z = kr.get(c);
    if (z) {
      if (l)
        l(z, 4);
      else
        for (const W of z) W();
      kr.delete(c);
    }
  }, e ? s ? xe(!0) : Re = c.run() : o ? o(xe.bind(null, !0), !0) : c.run(), te.pause = c.pause.bind(c), te.resume = c.resume.bind(c), te.stop = te, te;
}
function dn(t, e = 1 / 0, n) {
  if (e <= 0 || !lt(t) || t.__v_skip || (n = n || /* @__PURE__ */ new Set(), n.has(t)))
    return t;
  if (n.add(t), e--, xt(t))
    dn(t.value, e, n);
  else if (he(t))
    for (let s = 0; s < t.length; s++)
      dn(t[s], e, n);
  else if (Ka(t) || Jn(t))
    t.forEach((s) => {
      dn(s, e, n);
    });
  else if (Xa(t)) {
    for (const s in t)
      dn(t[s], e, n);
    for (const s of Object.getOwnPropertySymbols(t))
      Object.prototype.propertyIsEnumerable.call(t, s) && dn(t[s], e, n);
  }
  return t;
}
/**
* @vue/runtime-core v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function js(t, e, n, s) {
  try {
    return s ? t(...s) : t();
  } catch (r) {
    Br(r, e, n);
  }
}
function rn(t, e, n, s) {
  if (ye(t)) {
    const r = js(t, e, n, s);
    return r && Ga(r) && r.catch((i) => {
      Br(i, e, n);
    }), r;
  }
  if (he(t)) {
    const r = [];
    for (let i = 0; i < t.length; i++)
      r.push(rn(t[i], e, n, s));
    return r;
  }
}
function Br(t, e, n, s = !0) {
  const r = e ? e.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: o } = e && e.appContext.config || Ze;
  if (e) {
    let a = e.parent;
    const l = e.proxy, h = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; a; ) {
      const c = a.ec;
      if (c) {
        for (let b = 0; b < c.length; b++)
          if (c[b](t, l, h) === !1)
            return;
      }
      a = a.parent;
    }
    if (i) {
      _n(), js(i, null, 10, [
        t,
        l,
        h
      ]), yn();
      return;
    }
  }
  $u(t, n, r, s, o);
}
function $u(t, e, n, s = !0, r = !1) {
  if (r)
    throw t;
  console.error(t);
}
const Et = [];
let Qt = -1;
const es = [];
let An = null, Yn = 0;
const _l = /* @__PURE__ */ Promise.resolve();
let xr = null;
function Si(t) {
  const e = xr || _l;
  return t ? e.then(this ? t.bind(this) : t) : e;
}
function Uu(t) {
  let e = Qt + 1, n = Et.length;
  for (; e < n; ) {
    const s = e + n >>> 1, r = Et[s], i = zs(r);
    i < t || i === t && r.flags & 2 ? e = s + 1 : n = s;
  }
  return e;
}
function to(t) {
  if (!(t.flags & 1)) {
    const e = zs(t), n = Et[Et.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(t.flags & 2) && e >= zs(n) ? Et.push(t) : Et.splice(Uu(e), 0, t), t.flags |= 1, yl();
  }
}
function yl() {
  xr || (xr = _l.then(bl));
}
function zu(t) {
  he(t) ? es.push(...t) : An && t.id === -1 ? An.splice(Yn + 1, 0, t) : t.flags & 1 || (es.push(t), t.flags |= 1), yl();
}
function Xo(t, e, n = Qt + 1) {
  for (; n < Et.length; n++) {
    const s = Et[n];
    if (s && s.flags & 2) {
      if (t && s.id !== t.uid)
        continue;
      Et.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function vl(t) {
  if (es.length) {
    const e = [...new Set(es)].sort(
      (n, s) => zs(n) - zs(s)
    );
    if (es.length = 0, An) {
      An.push(...e);
      return;
    }
    for (An = e, Yn = 0; Yn < An.length; Yn++) {
      const n = An[Yn];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    An = null, Yn = 0;
  }
}
const zs = (t) => t.id == null ? t.flags & 2 ? -1 : 1 / 0 : t.id;
function bl(t) {
  try {
    for (Qt = 0; Qt < Et.length; Qt++) {
      const e = Et[Qt];
      e && !(e.flags & 8) && (e.flags & 4 && (e.flags &= -2), js(
        e,
        e.i,
        e.i ? 15 : 14
      ), e.flags & 4 || (e.flags &= -2));
    }
  } finally {
    for (; Qt < Et.length; Qt++) {
      const e = Et[Qt];
      e && (e.flags &= -2);
    }
    Qt = -1, Et.length = 0, vl(), xr = null, (Et.length || es.length) && bl();
  }
}
let Ut = null, wl = null;
function Ar(t) {
  const e = Ut;
  return Ut = t, wl = t && t.type.__scopeId || null, e;
}
function Hu(t, e = Ut, n) {
  if (!e || t._n)
    return t;
  const s = (...r) => {
    s._d && ia(-1);
    const i = Ar(e);
    let o;
    try {
      o = t(...r);
    } finally {
      Ar(i), s._d && ia(1);
    }
    return o;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function xn(t, e) {
  if (Ut === null)
    return t;
  const n = Hr(Ut), s = t.dirs || (t.dirs = []);
  for (let r = 0; r < e.length; r++) {
    let [i, o, a, l = Ze] = e[r];
    i && (ye(i) && (i = {
      mounted: i,
      updated: i
    }), i.deep && dn(o), s.push({
      dir: i,
      instance: n,
      value: o,
      oldValue: void 0,
      arg: a,
      modifiers: l
    }));
  }
  return t;
}
function Fn(t, e, n, s) {
  const r = t.dirs, i = e && e.dirs;
  for (let o = 0; o < r.length; o++) {
    const a = r[o];
    i && (a.oldValue = i[o].value);
    let l = a.dir[s];
    l && (_n(), rn(l, n, 8, [
      t.el,
      a,
      t,
      e
    ]), yn());
  }
}
const qu = Symbol("_vte"), Wu = (t) => t.__isTeleport;
function no(t, e) {
  t.shapeFlag & 6 && t.component ? (t.transition = e, no(t.component.subTree, e)) : t.shapeFlag & 128 ? (t.ssContent.transition = e.clone(t.ssContent), t.ssFallback.transition = e.clone(t.ssFallback)) : t.transition = e;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function ju(t, e) {
  return ye(t) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    At({ name: t.name }, e, { setup: t })
  ) : t;
}
function kl(t) {
  t.ids = [t.ids[0] + t.ids[2]++ + "-", 0, 0];
}
function Ns(t, e, n, s, r = !1) {
  if (he(t)) {
    t.forEach(
      ($, j) => Ns(
        $,
        e && (he(e) ? e[j] : e),
        n,
        s,
        r
      )
    );
    return;
  }
  if (Fs(s) && !r) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Ns(t, e, n, s.component.subTree);
    return;
  }
  const i = s.shapeFlag & 4 ? Hr(s.component) : s.el, o = r ? null : i, { i: a, r: l } = t, h = e && e.r, c = a.refs === Ze ? a.refs = {} : a.refs, b = a.setupState, m = Ue(b), P = b === Ze ? () => !1 : ($) => ze(m, $);
  if (h != null && h !== l && (gt(h) ? (c[h] = null, P(h) && (b[h] = null)) : xt(h) && (h.value = null)), ye(l))
    js(l, a, 12, [o, c]);
  else {
    const $ = gt(l), j = xt(l);
    if ($ || j) {
      const Le = () => {
        if (t.f) {
          const te = $ ? P(l) ? b[l] : c[l] : l.value;
          r ? he(te) && Vi(te, i) : he(te) ? te.includes(i) || te.push(i) : $ ? (c[l] = [i], P(l) && (b[l] = c[l])) : (l.value = [i], t.k && (c[t.k] = l.value));
        } else $ ? (c[l] = o, P(l) && (b[l] = o)) : j && (l.value = o, t.k && (c[t.k] = o));
      };
      o ? (Le.id = -1, Mt(Le, n)) : Le();
    }
  }
}
Fr().requestIdleCallback;
Fr().cancelIdleCallback;
const Fs = (t) => !!t.type.__asyncLoader, xl = (t) => t.type.__isKeepAlive;
function Vu(t, e) {
  Al(t, "a", e);
}
function Ku(t, e) {
  Al(t, "da", e);
}
function Al(t, e, n = Ct) {
  const s = t.__wdc || (t.__wdc = () => {
    let r = n;
    for (; r; ) {
      if (r.isDeactivated)
        return;
      r = r.parent;
    }
    return t();
  });
  if ($r(e, s, n), n) {
    let r = n.parent;
    for (; r && r.parent; )
      xl(r.parent.vnode) && Gu(s, e, n, r), r = r.parent;
  }
}
function Gu(t, e, n, s) {
  const r = $r(
    e,
    t,
    s,
    !0
    /* prepend */
  );
  Vs(() => {
    Vi(s[e], r);
  }, n);
}
function $r(t, e, n = Ct, s = !1) {
  if (n) {
    const r = n[t] || (n[t] = []), i = e.__weh || (e.__weh = (...o) => {
      _n();
      const a = Ks(n), l = rn(e, n, t, o);
      return a(), yn(), l;
    });
    return s ? r.unshift(i) : r.push(i), i;
  }
}
const vn = (t) => (e, n = Ct) => {
  (!qs || t === "sp") && $r(t, (...s) => e(...s), n);
}, Yu = vn("bm"), so = vn("m"), Xu = vn(
  "bu"
), Zu = vn("u"), Ju = vn(
  "bum"
), Vs = vn("um"), Qu = vn(
  "sp"
), ef = vn("rtg"), tf = vn("rtc");
function nf(t, e = Ct) {
  $r("ec", t, e);
}
const sf = Symbol.for("v-ndc");
function Nt(t, e, n, s) {
  let r;
  const i = n, o = he(t);
  if (o || gt(t)) {
    const a = o && Qn(t);
    let l = !1, h = !1;
    a && (l = !zt(t), h = Rn(t), t = Mr(t)), r = new Array(t.length);
    for (let c = 0, b = t.length; c < b; c++)
      r[c] = e(
        l ? h ? wr(yt(t[c])) : yt(t[c]) : t[c],
        c,
        void 0,
        i
      );
  } else if (typeof t == "number") {
    r = new Array(t);
    for (let a = 0; a < t; a++)
      r[a] = e(a + 1, a, void 0, i);
  } else if (lt(t))
    if (t[Symbol.iterator])
      r = Array.from(
        t,
        (a, l) => e(a, l, void 0, i)
      );
    else {
      const a = Object.keys(t);
      r = new Array(a.length);
      for (let l = 0, h = a.length; l < h; l++) {
        const c = a[l];
        r[l] = e(t[c], c, l, i);
      }
    }
  else
    r = [];
  return r;
}
const Ei = (t) => t ? jl(t) ? Hr(t) : Ei(t.parent) : null, Ms = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ At(/* @__PURE__ */ Object.create(null), {
    $: (t) => t,
    $el: (t) => t.vnode.el,
    $data: (t) => t.data,
    $props: (t) => t.props,
    $attrs: (t) => t.attrs,
    $slots: (t) => t.slots,
    $refs: (t) => t.refs,
    $parent: (t) => Ei(t.parent),
    $root: (t) => Ei(t.root),
    $host: (t) => t.ce,
    $emit: (t) => t.emit,
    $options: (t) => Sl(t),
    $forceUpdate: (t) => t.f || (t.f = () => {
      to(t.update);
    }),
    $nextTick: (t) => t.n || (t.n = Si.bind(t.proxy)),
    $watch: (t) => Sf.bind(t)
  })
), ri = (t, e) => t !== Ze && !t.__isScriptSetup && ze(t, e), rf = {
  get({ _: t }, e) {
    if (e === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: r, props: i, accessCache: o, type: a, appContext: l } = t;
    let h;
    if (e[0] !== "$") {
      const P = o[e];
      if (P !== void 0)
        switch (P) {
          case 1:
            return s[e];
          case 2:
            return r[e];
          case 4:
            return n[e];
          case 3:
            return i[e];
        }
      else {
        if (ri(s, e))
          return o[e] = 1, s[e];
        if (r !== Ze && ze(r, e))
          return o[e] = 2, r[e];
        if (
          // only cache other properties when instance has declared (thus stable)
          // props
          (h = t.propsOptions[0]) && ze(h, e)
        )
          return o[e] = 3, i[e];
        if (n !== Ze && ze(n, e))
          return o[e] = 4, n[e];
        Ci && (o[e] = 0);
      }
    }
    const c = Ms[e];
    let b, m;
    if (c)
      return e === "$attrs" && kt(t.attrs, "get", ""), c(t);
    if (
      // css module (injected by vue-loader)
      (b = a.__cssModules) && (b = b[e])
    )
      return b;
    if (n !== Ze && ze(n, e))
      return o[e] = 4, n[e];
    if (
      // global properties
      m = l.config.globalProperties, ze(m, e)
    )
      return m[e];
  },
  set({ _: t }, e, n) {
    const { data: s, setupState: r, ctx: i } = t;
    return ri(r, e) ? (r[e] = n, !0) : s !== Ze && ze(s, e) ? (s[e] = n, !0) : ze(t.props, e) || e[0] === "$" && e.slice(1) in t ? !1 : (i[e] = n, !0);
  },
  has({
    _: { data: t, setupState: e, accessCache: n, ctx: s, appContext: r, propsOptions: i }
  }, o) {
    let a;
    return !!n[o] || t !== Ze && ze(t, o) || ri(e, o) || (a = i[0]) && ze(a, o) || ze(s, o) || ze(Ms, o) || ze(r.config.globalProperties, o);
  },
  defineProperty(t, e, n) {
    return n.get != null ? t._.accessCache[e] = 0 : ze(n, "value") && this.set(t, e, n.value, null), Reflect.defineProperty(t, e, n);
  }
};
function Zo(t) {
  return he(t) ? t.reduce(
    (e, n) => (e[n] = null, e),
    {}
  ) : t;
}
let Ci = !0;
function of(t) {
  const e = Sl(t), n = t.proxy, s = t.ctx;
  Ci = !1, e.beforeCreate && Jo(e.beforeCreate, t, "bc");
  const {
    // state
    data: r,
    computed: i,
    methods: o,
    watch: a,
    provide: l,
    inject: h,
    // lifecycle
    created: c,
    beforeMount: b,
    mounted: m,
    beforeUpdate: P,
    updated: $,
    activated: j,
    deactivated: Le,
    beforeDestroy: te,
    beforeUnmount: Re,
    destroyed: xe,
    unmounted: z,
    render: W,
    renderTracked: ne,
    renderTriggered: V,
    errorCaptured: Fe,
    serverPrefetch: it,
    // public API
    expose: Ve,
    inheritAttrs: Te,
    // assets
    components: me,
    directives: Ke,
    filters: Je
  } = e;
  if (h && af(h, s, null), o)
    for (const _e in o) {
      const le = o[_e];
      ye(le) && (s[_e] = le.bind(n));
    }
  if (r) {
    const _e = r.call(n, n);
    lt(_e) && (t.data = Dr(_e));
  }
  if (Ci = !0, i)
    for (const _e in i) {
      const le = i[_e], ft = ye(le) ? le.bind(n, n) : ye(le.get) ? le.get.bind(n, n) : tn, ot = !ye(le) && ye(le.set) ? le.set.bind(n) : tn, ie = Ce({
        get: ft,
        set: ot
      });
      Object.defineProperty(s, _e, {
        enumerable: !0,
        configurable: !0,
        get: () => ie.value,
        set: (nt) => ie.value = nt
      });
    }
  if (a)
    for (const _e in a)
      Tl(a[_e], s, n, _e);
  if (l) {
    const _e = ye(l) ? l.call(n) : l;
    Reflect.ownKeys(_e).forEach((le) => {
      df(le, _e[le]);
    });
  }
  c && Jo(c, t, "c");
  function ae(_e, le) {
    he(le) ? le.forEach((ft) => _e(ft.bind(n))) : le && _e(le.bind(n));
  }
  if (ae(Yu, b), ae(so, m), ae(Xu, P), ae(Zu, $), ae(Vu, j), ae(Ku, Le), ae(nf, Fe), ae(tf, ne), ae(ef, V), ae(Ju, Re), ae(Vs, z), ae(Qu, it), he(Ve))
    if (Ve.length) {
      const _e = t.exposed || (t.exposed = {});
      Ve.forEach((le) => {
        Object.defineProperty(_e, le, {
          get: () => n[le],
          set: (ft) => n[le] = ft,
          enumerable: !0
        });
      });
    } else t.exposed || (t.exposed = {});
  W && t.render === tn && (t.render = W), Te != null && (t.inheritAttrs = Te), me && (t.components = me), Ke && (t.directives = Ke), it && kl(t);
}
function af(t, e, n = tn) {
  he(t) && (t = Ri(t));
  for (const s in t) {
    const r = t[s];
    let i;
    lt(r) ? "default" in r ? i = ur(
      r.from || s,
      r.default,
      !0
    ) : i = ur(r.from || s) : i = ur(r), xt(i) ? Object.defineProperty(e, s, {
      enumerable: !0,
      configurable: !0,
      get: () => i.value,
      set: (o) => i.value = o
    }) : e[s] = i;
  }
}
function Jo(t, e, n) {
  rn(
    he(t) ? t.map((s) => s.bind(e.proxy)) : t.bind(e.proxy),
    e,
    n
  );
}
function Tl(t, e, n, s) {
  let r = s.includes(".") ? $l(n, s) : () => n[s];
  if (gt(t)) {
    const i = e[t];
    ye(i) && pn(r, i);
  } else if (ye(t))
    pn(r, t.bind(n));
  else if (lt(t))
    if (he(t))
      t.forEach((i) => Tl(i, e, n, s));
    else {
      const i = ye(t.handler) ? t.handler.bind(n) : e[t.handler];
      ye(i) && pn(r, i, t);
    }
}
function Sl(t) {
  const e = t.type, { mixins: n, extends: s } = e, {
    mixins: r,
    optionsCache: i,
    config: { optionMergeStrategies: o }
  } = t.appContext, a = i.get(e);
  let l;
  return a ? l = a : !r.length && !n && !s ? l = e : (l = {}, r.length && r.forEach(
    (h) => Tr(l, h, o, !0)
  ), Tr(l, e, o)), lt(e) && i.set(e, l), l;
}
function Tr(t, e, n, s = !1) {
  const { mixins: r, extends: i } = e;
  i && Tr(t, i, n, !0), r && r.forEach(
    (o) => Tr(t, o, n, !0)
  );
  for (const o in e)
    if (!(s && o === "expose")) {
      const a = lf[o] || n && n[o];
      t[o] = a ? a(t[o], e[o]) : e[o];
    }
  return t;
}
const lf = {
  data: Qo,
  props: ea,
  emits: ea,
  // objects
  methods: Cs,
  computed: Cs,
  // lifecycle
  beforeCreate: St,
  created: St,
  beforeMount: St,
  mounted: St,
  beforeUpdate: St,
  updated: St,
  beforeDestroy: St,
  beforeUnmount: St,
  destroyed: St,
  unmounted: St,
  activated: St,
  deactivated: St,
  errorCaptured: St,
  serverPrefetch: St,
  // assets
  components: Cs,
  directives: Cs,
  // watch
  watch: uf,
  // provide / inject
  provide: Qo,
  inject: cf
};
function Qo(t, e) {
  return e ? t ? function() {
    return At(
      ye(t) ? t.call(this, this) : t,
      ye(e) ? e.call(this, this) : e
    );
  } : e : t;
}
function cf(t, e) {
  return Cs(Ri(t), Ri(e));
}
function Ri(t) {
  if (he(t)) {
    const e = {};
    for (let n = 0; n < t.length; n++)
      e[t[n]] = t[n];
    return e;
  }
  return t;
}
function St(t, e) {
  return t ? [...new Set([].concat(t, e))] : e;
}
function Cs(t, e) {
  return t ? At(/* @__PURE__ */ Object.create(null), t, e) : e;
}
function ea(t, e) {
  return t ? he(t) && he(e) ? [.../* @__PURE__ */ new Set([...t, ...e])] : At(
    /* @__PURE__ */ Object.create(null),
    Zo(t),
    Zo(e ?? {})
  ) : e;
}
function uf(t, e) {
  if (!t) return e;
  if (!e) return t;
  const n = At(/* @__PURE__ */ Object.create(null), t);
  for (const s in e)
    n[s] = St(t[s], e[s]);
  return n;
}
function El() {
  return {
    app: null,
    config: {
      isNativeTag: Qc,
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
let ff = 0;
function hf(t, e) {
  return function(s, r = null) {
    ye(s) || (s = At({}, s)), r != null && !lt(r) && (r = null);
    const i = El(), o = /* @__PURE__ */ new WeakSet(), a = [];
    let l = !1;
    const h = i.app = {
      _uid: ff++,
      _component: s,
      _props: r,
      _container: null,
      _context: i,
      _instance: null,
      version: Gf,
      get config() {
        return i.config;
      },
      set config(c) {
      },
      use(c, ...b) {
        return o.has(c) || (c && ye(c.install) ? (o.add(c), c.install(h, ...b)) : ye(c) && (o.add(c), c(h, ...b))), h;
      },
      mixin(c) {
        return i.mixins.includes(c) || i.mixins.push(c), h;
      },
      component(c, b) {
        return b ? (i.components[c] = b, h) : i.components[c];
      },
      directive(c, b) {
        return b ? (i.directives[c] = b, h) : i.directives[c];
      },
      mount(c, b, m) {
        if (!l) {
          const P = h._ceVNode || nn(s, r);
          return P.appContext = i, m === !0 ? m = "svg" : m === !1 && (m = void 0), t(P, c, m), l = !0, h._container = c, c.__vue_app__ = h, Hr(P.component);
        }
      },
      onUnmount(c) {
        a.push(c);
      },
      unmount() {
        l && (rn(
          a,
          h._instance,
          16
        ), t(null, h._container), delete h._container.__vue_app__);
      },
      provide(c, b) {
        return i.provides[c] = b, h;
      },
      runWithContext(c) {
        const b = ts;
        ts = h;
        try {
          return c();
        } finally {
          ts = b;
        }
      }
    };
    return h;
  };
}
let ts = null;
function df(t, e) {
  if (Ct) {
    let n = Ct.provides;
    const s = Ct.parent && Ct.parent.provides;
    s === n && (n = Ct.provides = Object.create(s)), n[t] = e;
  }
}
function ur(t, e, n = !1) {
  const s = Hf();
  if (s || ts) {
    let r = ts ? ts._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (r && t in r)
      return r[t];
    if (arguments.length > 1)
      return n && ye(e) ? e.call(s && s.proxy) : e;
  }
}
const Cl = {}, Rl = () => Object.create(Cl), Il = (t) => Object.getPrototypeOf(t) === Cl;
function pf(t, e, n, s = !1) {
  const r = {}, i = Rl();
  t.propsDefaults = /* @__PURE__ */ Object.create(null), Ll(t, e, r, i);
  for (const o in t.propsOptions[0])
    o in r || (r[o] = void 0);
  n ? t.props = s ? r : Iu(r) : t.type.props ? t.props = r : t.props = i, t.attrs = i;
}
function gf(t, e, n, s) {
  const {
    props: r,
    attrs: i,
    vnode: { patchFlag: o }
  } = t, a = Ue(r), [l] = t.propsOptions;
  let h = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (s || o > 0) && !(o & 16)
  ) {
    if (o & 8) {
      const c = t.vnode.dynamicProps;
      for (let b = 0; b < c.length; b++) {
        let m = c[b];
        if (Ur(t.emitsOptions, m))
          continue;
        const P = e[m];
        if (l)
          if (ze(i, m))
            P !== i[m] && (i[m] = P, h = !0);
          else {
            const $ = Cn(m);
            r[$] = Ii(
              l,
              a,
              $,
              P,
              t,
              !1
            );
          }
        else
          P !== i[m] && (i[m] = P, h = !0);
      }
    }
  } else {
    Ll(t, e, r, i) && (h = !0);
    let c;
    for (const b in a)
      (!e || // for camelCase
      !ze(e, b) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((c = On(b)) === b || !ze(e, c))) && (l ? n && // for camelCase
      (n[b] !== void 0 || // for kebab-case
      n[c] !== void 0) && (r[b] = Ii(
        l,
        a,
        b,
        void 0,
        t,
        !0
      )) : delete r[b]);
    if (i !== a)
      for (const b in i)
        (!e || !ze(e, b)) && (delete i[b], h = !0);
  }
  h && hn(t.attrs, "set", "");
}
function Ll(t, e, n, s) {
  const [r, i] = t.propsOptions;
  let o = !1, a;
  if (e)
    for (let l in e) {
      if (Ls(l))
        continue;
      const h = e[l];
      let c;
      r && ze(r, c = Cn(l)) ? !i || !i.includes(c) ? n[c] = h : (a || (a = {}))[c] = h : Ur(t.emitsOptions, l) || (!(l in s) || h !== s[l]) && (s[l] = h, o = !0);
    }
  if (i) {
    const l = Ue(n), h = a || Ze;
    for (let c = 0; c < i.length; c++) {
      const b = i[c];
      n[b] = Ii(
        r,
        l,
        b,
        h[b],
        t,
        !ze(h, b)
      );
    }
  }
  return o;
}
function Ii(t, e, n, s, r, i) {
  const o = t[n];
  if (o != null) {
    const a = ze(o, "default");
    if (a && s === void 0) {
      const l = o.default;
      if (o.type !== Function && !o.skipFactory && ye(l)) {
        const { propsDefaults: h } = r;
        if (n in h)
          s = h[n];
        else {
          const c = Ks(r);
          s = h[n] = l.call(
            null,
            e
          ), c();
        }
      } else
        s = l;
      r.ce && r.ce._setProp(n, s);
    }
    o[
      0
      /* shouldCast */
    ] && (i && !a ? s = !1 : o[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === On(n)) && (s = !0));
  }
  return s;
}
const mf = /* @__PURE__ */ new WeakMap();
function Ol(t, e, n = !1) {
  const s = n ? mf : e.propsCache, r = s.get(t);
  if (r)
    return r;
  const i = t.props, o = {}, a = [];
  let l = !1;
  if (!ye(t)) {
    const c = (b) => {
      l = !0;
      const [m, P] = Ol(b, e, !0);
      At(o, m), P && a.push(...P);
    };
    !n && e.mixins.length && e.mixins.forEach(c), t.extends && c(t.extends), t.mixins && t.mixins.forEach(c);
  }
  if (!i && !l)
    return lt(t) && s.set(t, Zn), Zn;
  if (he(i))
    for (let c = 0; c < i.length; c++) {
      const b = Cn(i[c]);
      ta(b) && (o[b] = Ze);
    }
  else if (i)
    for (const c in i) {
      const b = Cn(c);
      if (ta(b)) {
        const m = i[c], P = o[b] = he(m) || ye(m) ? { type: m } : At({}, m), $ = P.type;
        let j = !1, Le = !0;
        if (he($))
          for (let te = 0; te < $.length; ++te) {
            const Re = $[te], xe = ye(Re) && Re.name;
            if (xe === "Boolean") {
              j = !0;
              break;
            } else xe === "String" && (Le = !1);
          }
        else
          j = ye($) && $.name === "Boolean";
        P[
          0
          /* shouldCast */
        ] = j, P[
          1
          /* shouldCastTrue */
        ] = Le, (j || ze(P, "default")) && a.push(b);
      }
    }
  const h = [o, a];
  return lt(t) && s.set(t, h), h;
}
function ta(t) {
  return t[0] !== "$" && !Ls(t);
}
const ro = (t) => t === "_" || t === "__" || t === "_ctx" || t === "$stable", io = (t) => he(t) ? t.map(en) : [en(t)], _f = (t, e, n) => {
  if (e._n)
    return e;
  const s = Hu((...r) => io(e(...r)), n);
  return s._c = !1, s;
}, Pl = (t, e, n) => {
  const s = t._ctx;
  for (const r in t) {
    if (ro(r)) continue;
    const i = t[r];
    if (ye(i))
      e[r] = _f(r, i, s);
    else if (i != null) {
      const o = io(i);
      e[r] = () => o;
    }
  }
}, Nl = (t, e) => {
  const n = io(e);
  t.slots.default = () => n;
}, Fl = (t, e, n) => {
  for (const s in e)
    (n || !ro(s)) && (t[s] = e[s]);
}, yf = (t, e, n) => {
  const s = t.slots = Rl();
  if (t.vnode.shapeFlag & 32) {
    const r = e.__;
    r && bi(s, "__", r, !0);
    const i = e._;
    i ? (Fl(s, e, n), n && bi(s, "_", i, !0)) : Pl(e, s);
  } else e && Nl(t, e);
}, vf = (t, e, n) => {
  const { vnode: s, slots: r } = t;
  let i = !0, o = Ze;
  if (s.shapeFlag & 32) {
    const a = e._;
    a ? n && a === 1 ? i = !1 : Fl(r, e, n) : (i = !e.$stable, Pl(e, r)), o = e;
  } else e && (Nl(t, e), o = { default: 1 });
  if (i)
    for (const a in r)
      !ro(a) && o[a] == null && delete r[a];
}, Mt = Pf;
function bf(t) {
  return wf(t);
}
function wf(t, e) {
  const n = Fr();
  n.__VUE__ = !0;
  const {
    insert: s,
    remove: r,
    patchProp: i,
    createElement: o,
    createText: a,
    createComment: l,
    setText: h,
    setElementText: c,
    parentNode: b,
    nextSibling: m,
    setScopeId: P = tn,
    insertStaticContent: $
  } = t, j = (p, y, k, O = null, R = null, L = null, B = void 0, D = null, M = !!y.dynamicChildren) => {
    if (p === y)
      return;
    p && !ms(p, y) && (O = Ie(p), nt(p, R, L, !0), p = null), y.patchFlag === -2 && (M = !1, y.dynamicChildren = null);
    const { type: N, ref: X, shapeFlag: U } = y;
    switch (N) {
      case zr:
        Le(p, y, k, O);
        break;
      case In:
        te(p, y, k, O);
        break;
      case fr:
        p == null && Re(y, k, O, B);
        break;
      case et:
        me(
          p,
          y,
          k,
          O,
          R,
          L,
          B,
          D,
          M
        );
        break;
      default:
        U & 1 ? W(
          p,
          y,
          k,
          O,
          R,
          L,
          B,
          D,
          M
        ) : U & 6 ? Ke(
          p,
          y,
          k,
          O,
          R,
          L,
          B,
          D,
          M
        ) : (U & 64 || U & 128) && N.process(
          p,
          y,
          k,
          O,
          R,
          L,
          B,
          D,
          M,
          ut
        );
    }
    X != null && R ? Ns(X, p && p.ref, L, y || p, !y) : X == null && p && p.ref != null && Ns(p.ref, null, L, p, !0);
  }, Le = (p, y, k, O) => {
    if (p == null)
      s(
        y.el = a(y.children),
        k,
        O
      );
    else {
      const R = y.el = p.el;
      y.children !== p.children && h(R, y.children);
    }
  }, te = (p, y, k, O) => {
    p == null ? s(
      y.el = l(y.children || ""),
      k,
      O
    ) : y.el = p.el;
  }, Re = (p, y, k, O) => {
    [p.el, p.anchor] = $(
      p.children,
      y,
      k,
      O,
      p.el,
      p.anchor
    );
  }, xe = ({ el: p, anchor: y }, k, O) => {
    let R;
    for (; p && p !== y; )
      R = m(p), s(p, k, O), p = R;
    s(y, k, O);
  }, z = ({ el: p, anchor: y }) => {
    let k;
    for (; p && p !== y; )
      k = m(p), r(p), p = k;
    r(y);
  }, W = (p, y, k, O, R, L, B, D, M) => {
    y.type === "svg" ? B = "svg" : y.type === "math" && (B = "mathml"), p == null ? ne(
      y,
      k,
      O,
      R,
      L,
      B,
      D,
      M
    ) : it(
      p,
      y,
      R,
      L,
      B,
      D,
      M
    );
  }, ne = (p, y, k, O, R, L, B, D) => {
    let M, N;
    const { props: X, shapeFlag: U, transition: G, dirs: Q } = p;
    if (M = p.el = o(
      p.type,
      L,
      X && X.is,
      X
    ), U & 8 ? c(M, p.children) : U & 16 && Fe(
      p.children,
      M,
      null,
      O,
      R,
      ii(p, L),
      B,
      D
    ), Q && Fn(p, null, O, "created"), V(M, p, p.scopeId, B, O), X) {
      for (const Oe in X)
        Oe !== "value" && !Ls(Oe) && i(M, Oe, null, X[Oe], L, O);
      "value" in X && i(M, "value", null, X.value, L), (N = X.onVnodeBeforeMount) && Zt(N, O, p);
    }
    Q && Fn(p, null, O, "beforeMount");
    const ue = kf(R, G);
    ue && G.beforeEnter(M), s(M, y, k), ((N = X && X.onVnodeMounted) || ue || Q) && Mt(() => {
      N && Zt(N, O, p), ue && G.enter(M), Q && Fn(p, null, O, "mounted");
    }, R);
  }, V = (p, y, k, O, R) => {
    if (k && P(p, k), O)
      for (let L = 0; L < O.length; L++)
        P(p, O[L]);
    if (R) {
      let L = R.subTree;
      if (y === L || zl(L.type) && (L.ssContent === y || L.ssFallback === y)) {
        const B = R.vnode;
        V(
          p,
          B,
          B.scopeId,
          B.slotScopeIds,
          R.parent
        );
      }
    }
  }, Fe = (p, y, k, O, R, L, B, D, M = 0) => {
    for (let N = M; N < p.length; N++) {
      const X = p[N] = D ? Tn(p[N]) : en(p[N]);
      j(
        null,
        X,
        y,
        k,
        O,
        R,
        L,
        B,
        D
      );
    }
  }, it = (p, y, k, O, R, L, B) => {
    const D = y.el = p.el;
    let { patchFlag: M, dynamicChildren: N, dirs: X } = y;
    M |= p.patchFlag & 16;
    const U = p.props || Ze, G = y.props || Ze;
    let Q;
    if (k && Mn(k, !1), (Q = G.onVnodeBeforeUpdate) && Zt(Q, k, y, p), X && Fn(y, p, k, "beforeUpdate"), k && Mn(k, !0), (U.innerHTML && G.innerHTML == null || U.textContent && G.textContent == null) && c(D, ""), N ? Ve(
      p.dynamicChildren,
      N,
      D,
      k,
      O,
      ii(y, R),
      L
    ) : B || le(
      p,
      y,
      D,
      null,
      k,
      O,
      ii(y, R),
      L,
      !1
    ), M > 0) {
      if (M & 16)
        Te(D, U, G, k, R);
      else if (M & 2 && U.class !== G.class && i(D, "class", null, G.class, R), M & 4 && i(D, "style", U.style, G.style, R), M & 8) {
        const ue = y.dynamicProps;
        for (let Oe = 0; Oe < ue.length; Oe++) {
          const pe = ue[Oe], De = U[pe], Be = G[pe];
          (Be !== De || pe === "value") && i(D, pe, De, Be, R, k);
        }
      }
      M & 1 && p.children !== y.children && c(D, y.children);
    } else !B && N == null && Te(D, U, G, k, R);
    ((Q = G.onVnodeUpdated) || X) && Mt(() => {
      Q && Zt(Q, k, y, p), X && Fn(y, p, k, "updated");
    }, O);
  }, Ve = (p, y, k, O, R, L, B) => {
    for (let D = 0; D < y.length; D++) {
      const M = p[D], N = y[D], X = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        M.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (M.type === et || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !ms(M, N) || // - In the case of a component, it could contain anything.
        M.shapeFlag & 198) ? b(M.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          k
        )
      );
      j(
        M,
        N,
        X,
        null,
        O,
        R,
        L,
        B,
        !0
      );
    }
  }, Te = (p, y, k, O, R) => {
    if (y !== k) {
      if (y !== Ze)
        for (const L in y)
          !Ls(L) && !(L in k) && i(
            p,
            L,
            y[L],
            null,
            R,
            O
          );
      for (const L in k) {
        if (Ls(L)) continue;
        const B = k[L], D = y[L];
        B !== D && L !== "value" && i(p, L, D, B, R, O);
      }
      "value" in k && i(p, "value", y.value, k.value, R);
    }
  }, me = (p, y, k, O, R, L, B, D, M) => {
    const N = y.el = p ? p.el : a(""), X = y.anchor = p ? p.anchor : a("");
    let { patchFlag: U, dynamicChildren: G, slotScopeIds: Q } = y;
    Q && (D = D ? D.concat(Q) : Q), p == null ? (s(N, k, O), s(X, k, O), Fe(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      y.children || [],
      k,
      X,
      R,
      L,
      B,
      D,
      M
    )) : U > 0 && U & 64 && G && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    p.dynamicChildren ? (Ve(
      p.dynamicChildren,
      G,
      k,
      R,
      L,
      B,
      D
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (y.key != null || R && y === R.subTree) && Ml(
      p,
      y,
      !0
      /* shallow */
    )) : le(
      p,
      y,
      k,
      X,
      R,
      L,
      B,
      D,
      M
    );
  }, Ke = (p, y, k, O, R, L, B, D, M) => {
    y.slotScopeIds = D, p == null ? y.shapeFlag & 512 ? R.ctx.activate(
      y,
      k,
      O,
      B,
      M
    ) : Je(
      y,
      k,
      O,
      R,
      L,
      B,
      M
    ) : ct(p, y, M);
  }, Je = (p, y, k, O, R, L, B) => {
    const D = p.component = zf(
      p,
      O,
      R
    );
    if (xl(p) && (D.ctx.renderer = ut), qf(D, !1, B), D.asyncDep) {
      if (R && R.registerDep(D, ae, B), !p.el) {
        const M = D.subTree = nn(In);
        te(null, M, y, k), p.placeholder = M.el;
      }
    } else
      ae(
        D,
        p,
        y,
        k,
        R,
        L,
        B
      );
  }, ct = (p, y, k) => {
    const O = y.component = p.component;
    if (Lf(p, y, k))
      if (O.asyncDep && !O.asyncResolved) {
        _e(O, y, k);
        return;
      } else
        O.next = y, O.update();
    else
      y.el = p.el, O.vnode = y;
  }, ae = (p, y, k, O, R, L, B) => {
    const D = () => {
      if (p.isMounted) {
        let { next: U, bu: G, u: Q, parent: ue, vnode: Oe } = p;
        {
          const f = Dl(p);
          if (f) {
            U && (U.el = Oe.el, _e(p, U, B)), f.asyncDep.then(() => {
              p.isUnmounted || D();
            });
            return;
          }
        }
        let pe = U, De;
        Mn(p, !1), U ? (U.el = Oe.el, _e(p, U, B)) : U = Oe, G && cr(G), (De = U.props && U.props.onVnodeBeforeUpdate) && Zt(De, ue, U, Oe), Mn(p, !0);
        const Be = sa(p), qe = p.subTree;
        p.subTree = Be, j(
          qe,
          Be,
          // parent may have changed if it's in a teleport
          b(qe.el),
          // anchor may have changed if it's in a fragment
          Ie(qe),
          p,
          R,
          L
        ), U.el = Be.el, pe === null && Of(p, Be.el), Q && Mt(Q, R), (De = U.props && U.props.onVnodeUpdated) && Mt(
          () => Zt(De, ue, U, Oe),
          R
        );
      } else {
        let U;
        const { el: G, props: Q } = y, { bm: ue, m: Oe, parent: pe, root: De, type: Be } = p, qe = Fs(y);
        Mn(p, !1), ue && cr(ue), !qe && (U = Q && Q.onVnodeBeforeMount) && Zt(U, pe, y), Mn(p, !0);
        {
          De.ce && // @ts-expect-error _def is private
          De.ce._def.shadowRoot !== !1 && De.ce._injectChildStyle(Be);
          const f = p.subTree = sa(p);
          j(
            null,
            f,
            k,
            O,
            p,
            R,
            L
          ), y.el = f.el;
        }
        if (Oe && Mt(Oe, R), !qe && (U = Q && Q.onVnodeMounted)) {
          const f = y;
          Mt(
            () => Zt(U, pe, f),
            R
          );
        }
        (y.shapeFlag & 256 || pe && Fs(pe.vnode) && pe.vnode.shapeFlag & 256) && p.a && Mt(p.a, R), p.isMounted = !0, y = k = O = null;
      }
    };
    p.scope.on();
    const M = p.effect = new tl(D);
    p.scope.off();
    const N = p.update = M.run.bind(M), X = p.job = M.runIfDirty.bind(M);
    X.i = p, X.id = p.uid, M.scheduler = () => to(X), Mn(p, !0), N();
  }, _e = (p, y, k) => {
    y.component = p;
    const O = p.vnode.props;
    p.vnode = y, p.next = null, gf(p, y.props, O, k), vf(p, y.children, k), _n(), Xo(p), yn();
  }, le = (p, y, k, O, R, L, B, D, M = !1) => {
    const N = p && p.children, X = p ? p.shapeFlag : 0, U = y.children, { patchFlag: G, shapeFlag: Q } = y;
    if (G > 0) {
      if (G & 128) {
        ot(
          N,
          U,
          k,
          O,
          R,
          L,
          B,
          D,
          M
        );
        return;
      } else if (G & 256) {
        ft(
          N,
          U,
          k,
          O,
          R,
          L,
          B,
          D,
          M
        );
        return;
      }
    }
    Q & 8 ? (X & 16 && se(N, R, L), U !== N && c(k, U)) : X & 16 ? Q & 16 ? ot(
      N,
      U,
      k,
      O,
      R,
      L,
      B,
      D,
      M
    ) : se(N, R, L, !0) : (X & 8 && c(k, ""), Q & 16 && Fe(
      U,
      k,
      O,
      R,
      L,
      B,
      D,
      M
    ));
  }, ft = (p, y, k, O, R, L, B, D, M) => {
    p = p || Zn, y = y || Zn;
    const N = p.length, X = y.length, U = Math.min(N, X);
    let G;
    for (G = 0; G < U; G++) {
      const Q = y[G] = M ? Tn(y[G]) : en(y[G]);
      j(
        p[G],
        Q,
        k,
        null,
        R,
        L,
        B,
        D,
        M
      );
    }
    N > X ? se(
      p,
      R,
      L,
      !0,
      !1,
      U
    ) : Fe(
      y,
      k,
      O,
      R,
      L,
      B,
      D,
      M,
      U
    );
  }, ot = (p, y, k, O, R, L, B, D, M) => {
    let N = 0;
    const X = y.length;
    let U = p.length - 1, G = X - 1;
    for (; N <= U && N <= G; ) {
      const Q = p[N], ue = y[N] = M ? Tn(y[N]) : en(y[N]);
      if (ms(Q, ue))
        j(
          Q,
          ue,
          k,
          null,
          R,
          L,
          B,
          D,
          M
        );
      else
        break;
      N++;
    }
    for (; N <= U && N <= G; ) {
      const Q = p[U], ue = y[G] = M ? Tn(y[G]) : en(y[G]);
      if (ms(Q, ue))
        j(
          Q,
          ue,
          k,
          null,
          R,
          L,
          B,
          D,
          M
        );
      else
        break;
      U--, G--;
    }
    if (N > U) {
      if (N <= G) {
        const Q = G + 1, ue = Q < X ? y[Q].el : O;
        for (; N <= G; )
          j(
            null,
            y[N] = M ? Tn(y[N]) : en(y[N]),
            k,
            ue,
            R,
            L,
            B,
            D,
            M
          ), N++;
      }
    } else if (N > G)
      for (; N <= U; )
        nt(p[N], R, L, !0), N++;
    else {
      const Q = N, ue = N, Oe = /* @__PURE__ */ new Map();
      for (N = ue; N <= G; N++) {
        const x = y[N] = M ? Tn(y[N]) : en(y[N]);
        x.key != null && Oe.set(x.key, N);
      }
      let pe, De = 0;
      const Be = G - ue + 1;
      let qe = !1, f = 0;
      const v = new Array(Be);
      for (N = 0; N < Be; N++) v[N] = 0;
      for (N = Q; N <= U; N++) {
        const x = p[N];
        if (De >= Be) {
          nt(x, R, L, !0);
          continue;
        }
        let F;
        if (x.key != null)
          F = Oe.get(x.key);
        else
          for (pe = ue; pe <= G; pe++)
            if (v[pe - ue] === 0 && ms(x, y[pe])) {
              F = pe;
              break;
            }
        F === void 0 ? nt(x, R, L, !0) : (v[F - ue] = N + 1, F >= f ? f = F : qe = !0, j(
          x,
          y[F],
          k,
          null,
          R,
          L,
          B,
          D,
          M
        ), De++);
      }
      const A = qe ? xf(v) : Zn;
      for (pe = A.length - 1, N = Be - 1; N >= 0; N--) {
        const x = ue + N, F = y[x], Y = y[x + 1], ee = x + 1 < X ? (
          // #13559, fallback to el placeholder for unresolved async component
          Y.el || Y.placeholder
        ) : O;
        v[N] === 0 ? j(
          null,
          F,
          k,
          ee,
          R,
          L,
          B,
          D,
          M
        ) : qe && (pe < 0 || N !== A[pe] ? ie(F, k, ee, 2) : pe--);
      }
    }
  }, ie = (p, y, k, O, R = null) => {
    const { el: L, type: B, transition: D, children: M, shapeFlag: N } = p;
    if (N & 6) {
      ie(p.component.subTree, y, k, O);
      return;
    }
    if (N & 128) {
      p.suspense.move(y, k, O);
      return;
    }
    if (N & 64) {
      B.move(p, y, k, ut);
      return;
    }
    if (B === et) {
      s(L, y, k);
      for (let U = 0; U < M.length; U++)
        ie(M[U], y, k, O);
      s(p.anchor, y, k);
      return;
    }
    if (B === fr) {
      xe(p, y, k);
      return;
    }
    if (O !== 2 && N & 1 && D)
      if (O === 0)
        D.beforeEnter(L), s(L, y, k), Mt(() => D.enter(L), R);
      else {
        const { leave: U, delayLeave: G, afterLeave: Q } = D, ue = () => {
          p.ctx.isUnmounted ? r(L) : s(L, y, k);
        }, Oe = () => {
          U(L, () => {
            ue(), Q && Q();
          });
        };
        G ? G(L, ue, Oe) : Oe();
      }
    else
      s(L, y, k);
  }, nt = (p, y, k, O = !1, R = !1) => {
    const {
      type: L,
      props: B,
      ref: D,
      children: M,
      dynamicChildren: N,
      shapeFlag: X,
      patchFlag: U,
      dirs: G,
      cacheIndex: Q
    } = p;
    if (U === -2 && (R = !1), D != null && (_n(), Ns(D, null, k, p, !0), yn()), Q != null && (y.renderCache[Q] = void 0), X & 256) {
      y.ctx.deactivate(p);
      return;
    }
    const ue = X & 1 && G, Oe = !Fs(p);
    let pe;
    if (Oe && (pe = B && B.onVnodeBeforeUnmount) && Zt(pe, y, p), X & 6)
      de(p.component, k, O);
    else {
      if (X & 128) {
        p.suspense.unmount(k, O);
        return;
      }
      ue && Fn(p, null, y, "beforeUnmount"), X & 64 ? p.type.remove(
        p,
        y,
        k,
        ut,
        O
      ) : N && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !N.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (L !== et || U > 0 && U & 64) ? se(
        N,
        y,
        k,
        !1,
        !0
      ) : (L === et && U & 384 || !R && X & 16) && se(M, y, k), O && ve(p);
    }
    (Oe && (pe = B && B.onVnodeUnmounted) || ue) && Mt(() => {
      pe && Zt(pe, y, p), ue && Fn(p, null, y, "unmounted");
    }, k);
  }, ve = (p) => {
    const { type: y, el: k, anchor: O, transition: R } = p;
    if (y === et) {
      q(k, O);
      return;
    }
    if (y === fr) {
      z(p);
      return;
    }
    const L = () => {
      r(k), R && !R.persisted && R.afterLeave && R.afterLeave();
    };
    if (p.shapeFlag & 1 && R && !R.persisted) {
      const { leave: B, delayLeave: D } = R, M = () => B(k, L);
      D ? D(p.el, L, M) : M();
    } else
      L();
  }, q = (p, y) => {
    let k;
    for (; p !== y; )
      k = m(p), r(p), p = k;
    r(y);
  }, de = (p, y, k) => {
    const {
      bum: O,
      scope: R,
      job: L,
      subTree: B,
      um: D,
      m: M,
      a: N,
      parent: X,
      slots: { __: U }
    } = p;
    na(M), na(N), O && cr(O), X && he(U) && U.forEach((G) => {
      X.renderCache[G] = void 0;
    }), R.stop(), L && (L.flags |= 8, nt(B, p, y, k)), D && Mt(D, y), Mt(() => {
      p.isUnmounted = !0;
    }, y), y && y.pendingBranch && !y.isUnmounted && p.asyncDep && !p.asyncResolved && p.suspenseId === y.pendingId && (y.deps--, y.deps === 0 && y.resolve());
  }, se = (p, y, k, O = !1, R = !1, L = 0) => {
    for (let B = L; B < p.length; B++)
      nt(p[B], y, k, O, R);
  }, Ie = (p) => {
    if (p.shapeFlag & 6)
      return Ie(p.component.subTree);
    if (p.shapeFlag & 128)
      return p.suspense.next();
    const y = m(p.anchor || p.el), k = y && y[qu];
    return k ? m(k) : y;
  };
  let K = !1;
  const Qe = (p, y, k) => {
    p == null ? y._vnode && nt(y._vnode, null, null, !0) : j(
      y._vnode || null,
      p,
      y,
      null,
      null,
      null,
      k
    ), y._vnode = p, K || (K = !0, Xo(), vl(), K = !1);
  }, ut = {
    p: j,
    um: nt,
    m: ie,
    r: ve,
    mt: Je,
    mc: Fe,
    pc: le,
    pbc: Ve,
    n: Ie,
    o: t
  };
  return {
    render: Qe,
    hydrate: void 0,
    createApp: hf(Qe)
  };
}
function ii({ type: t, props: e }, n) {
  return n === "svg" && t === "foreignObject" || n === "mathml" && t === "annotation-xml" && e && e.encoding && e.encoding.includes("html") ? void 0 : n;
}
function Mn({ effect: t, job: e }, n) {
  n ? (t.flags |= 32, e.flags |= 4) : (t.flags &= -33, e.flags &= -5);
}
function kf(t, e) {
  return (!t || t && !t.pendingBranch) && e && !e.persisted;
}
function Ml(t, e, n = !1) {
  const s = t.children, r = e.children;
  if (he(s) && he(r))
    for (let i = 0; i < s.length; i++) {
      const o = s[i];
      let a = r[i];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = r[i] = Tn(r[i]), a.el = o.el), !n && a.patchFlag !== -2 && Ml(o, a)), a.type === zr && (a.el = o.el), a.type === In && !a.el && (a.el = o.el);
    }
}
function xf(t) {
  const e = t.slice(), n = [0];
  let s, r, i, o, a;
  const l = t.length;
  for (s = 0; s < l; s++) {
    const h = t[s];
    if (h !== 0) {
      if (r = n[n.length - 1], t[r] < h) {
        e[s] = r, n.push(s);
        continue;
      }
      for (i = 0, o = n.length - 1; i < o; )
        a = i + o >> 1, t[n[a]] < h ? i = a + 1 : o = a;
      h < t[n[i]] && (i > 0 && (e[s] = n[i - 1]), n[i] = s);
    }
  }
  for (i = n.length, o = n[i - 1]; i-- > 0; )
    n[i] = o, o = e[o];
  return n;
}
function Dl(t) {
  const e = t.subTree.component;
  if (e)
    return e.asyncDep && !e.asyncResolved ? e : Dl(e);
}
function na(t) {
  if (t)
    for (let e = 0; e < t.length; e++)
      t[e].flags |= 8;
}
const Af = Symbol.for("v-scx"), Tf = () => ur(Af);
function pn(t, e, n) {
  return Bl(t, e, n);
}
function Bl(t, e, n = Ze) {
  const { immediate: s, deep: r, flush: i, once: o } = n, a = At({}, n), l = e && s || !e && i !== "post";
  let h;
  if (qs) {
    if (i === "sync") {
      const P = Tf();
      h = P.__watcherHandles || (P.__watcherHandles = []);
    } else if (!l) {
      const P = () => {
      };
      return P.stop = tn, P.resume = tn, P.pause = tn, P;
    }
  }
  const c = Ct;
  a.call = (P, $, j) => rn(P, c, $, j);
  let b = !1;
  i === "post" ? a.scheduler = (P) => {
    Mt(P, c && c.suspense);
  } : i !== "sync" && (b = !0, a.scheduler = (P, $) => {
    $ ? P() : to(P);
  }), a.augmentJob = (P) => {
    e && (P.flags |= 4), b && (P.flags |= 2, c && (P.id = c.uid, P.i = c));
  };
  const m = Bu(t, e, a);
  return qs && (h ? h.push(m) : l && m()), m;
}
function Sf(t, e, n) {
  const s = this.proxy, r = gt(t) ? t.includes(".") ? $l(s, t) : () => s[t] : t.bind(s, s);
  let i;
  ye(e) ? i = e : (i = e.handler, n = e);
  const o = Ks(this), a = Bl(r, i.bind(s), n);
  return o(), a;
}
function $l(t, e) {
  const n = e.split(".");
  return () => {
    let s = t;
    for (let r = 0; r < n.length && s; r++)
      s = s[n[r]];
    return s;
  };
}
const Ef = (t, e) => e === "modelValue" || e === "model-value" ? t.modelModifiers : t[`${e}Modifiers`] || t[`${Cn(e)}Modifiers`] || t[`${On(e)}Modifiers`];
function Cf(t, e, ...n) {
  if (t.isUnmounted) return;
  const s = t.vnode.props || Ze;
  let r = n;
  const i = e.startsWith("update:"), o = i && Ef(s, e.slice(7));
  o && (o.trim && (r = n.map((c) => gt(c) ? c.trim() : c)), o.number && (r = n.map(wi)));
  let a, l = s[a = Qr(e)] || // also try camelCase event handler (#2249)
  s[a = Qr(Cn(e))];
  !l && i && (l = s[a = Qr(On(e))]), l && rn(
    l,
    t,
    6,
    r
  );
  const h = s[a + "Once"];
  if (h) {
    if (!t.emitted)
      t.emitted = {};
    else if (t.emitted[a])
      return;
    t.emitted[a] = !0, rn(
      h,
      t,
      6,
      r
    );
  }
}
function Ul(t, e, n = !1) {
  const s = e.emitsCache, r = s.get(t);
  if (r !== void 0)
    return r;
  const i = t.emits;
  let o = {}, a = !1;
  if (!ye(t)) {
    const l = (h) => {
      const c = Ul(h, e, !0);
      c && (a = !0, At(o, c));
    };
    !n && e.mixins.length && e.mixins.forEach(l), t.extends && l(t.extends), t.mixins && t.mixins.forEach(l);
  }
  return !i && !a ? (lt(t) && s.set(t, null), null) : (he(i) ? i.forEach((l) => o[l] = null) : At(o, i), lt(t) && s.set(t, o), o);
}
function Ur(t, e) {
  return !t || !Or(e) ? !1 : (e = e.slice(2).replace(/Once$/, ""), ze(t, e[0].toLowerCase() + e.slice(1)) || ze(t, On(e)) || ze(t, e));
}
function sa(t) {
  const {
    type: e,
    vnode: n,
    proxy: s,
    withProxy: r,
    propsOptions: [i],
    slots: o,
    attrs: a,
    emit: l,
    render: h,
    renderCache: c,
    props: b,
    data: m,
    setupState: P,
    ctx: $,
    inheritAttrs: j
  } = t, Le = Ar(t);
  let te, Re;
  try {
    if (n.shapeFlag & 4) {
      const z = r || s, W = z;
      te = en(
        h.call(
          W,
          z,
          c,
          b,
          P,
          m,
          $
        )
      ), Re = a;
    } else {
      const z = e;
      te = en(
        z.length > 1 ? z(
          b,
          { attrs: a, slots: o, emit: l }
        ) : z(
          b,
          null
        )
      ), Re = e.props ? a : Rf(a);
    }
  } catch (z) {
    Ds.length = 0, Br(z, t, 1), te = nn(In);
  }
  let xe = te;
  if (Re && j !== !1) {
    const z = Object.keys(Re), { shapeFlag: W } = xe;
    z.length && W & 7 && (i && z.some(ji) && (Re = If(
      Re,
      i
    )), xe = ss(xe, Re, !1, !0));
  }
  return n.dirs && (xe = ss(xe, null, !1, !0), xe.dirs = xe.dirs ? xe.dirs.concat(n.dirs) : n.dirs), n.transition && no(xe, n.transition), te = xe, Ar(Le), te;
}
const Rf = (t) => {
  let e;
  for (const n in t)
    (n === "class" || n === "style" || Or(n)) && ((e || (e = {}))[n] = t[n]);
  return e;
}, If = (t, e) => {
  const n = {};
  for (const s in t)
    (!ji(s) || !(s.slice(9) in e)) && (n[s] = t[s]);
  return n;
};
function Lf(t, e, n) {
  const { props: s, children: r, component: i } = t, { props: o, children: a, patchFlag: l } = e, h = i.emitsOptions;
  if (e.dirs || e.transition)
    return !0;
  if (n && l >= 0) {
    if (l & 1024)
      return !0;
    if (l & 16)
      return s ? ra(s, o, h) : !!o;
    if (l & 8) {
      const c = e.dynamicProps;
      for (let b = 0; b < c.length; b++) {
        const m = c[b];
        if (o[m] !== s[m] && !Ur(h, m))
          return !0;
      }
    }
  } else
    return (r || a) && (!a || !a.$stable) ? !0 : s === o ? !1 : s ? o ? ra(s, o, h) : !0 : !!o;
  return !1;
}
function ra(t, e, n) {
  const s = Object.keys(e);
  if (s.length !== Object.keys(t).length)
    return !0;
  for (let r = 0; r < s.length; r++) {
    const i = s[r];
    if (e[i] !== t[i] && !Ur(n, i))
      return !0;
  }
  return !1;
}
function Of({ vnode: t, parent: e }, n) {
  for (; e; ) {
    const s = e.subTree;
    if (s.suspense && s.suspense.activeBranch === t && (s.el = t.el), s === t)
      (t = e.vnode).el = n, e = e.parent;
    else
      break;
  }
}
const zl = (t) => t.__isSuspense;
function Pf(t, e) {
  e && e.pendingBranch ? he(t) ? e.effects.push(...t) : e.effects.push(t) : zu(t);
}
const et = Symbol.for("v-fgt"), zr = Symbol.for("v-txt"), In = Symbol.for("v-cmt"), fr = Symbol.for("v-stc"), Ds = [];
let Dt = null;
function T(t = !1) {
  Ds.push(Dt = t ? null : []);
}
function Nf() {
  Ds.pop(), Dt = Ds[Ds.length - 1] || null;
}
let Hs = 1;
function ia(t, e = !1) {
  Hs += t, t < 0 && Dt && e && (Dt.hasOnce = !0);
}
function Hl(t) {
  return t.dynamicChildren = Hs > 0 ? Dt || Zn : null, Nf(), Hs > 0 && Dt && Dt.push(t), t;
}
function S(t, e, n, s, r, i) {
  return Hl(
    w(
      t,
      e,
      n,
      s,
      r,
      i,
      !0
    )
  );
}
function Ff(t, e, n, s, r) {
  return Hl(
    nn(
      t,
      e,
      n,
      s,
      r,
      !0
    )
  );
}
function ql(t) {
  return t ? t.__v_isVNode === !0 : !1;
}
function ms(t, e) {
  return t.type === e.type && t.key === e.key;
}
const Wl = ({ key: t }) => t ?? null, hr = ({
  ref: t,
  ref_key: e,
  ref_for: n
}) => (typeof t == "number" && (t = "" + t), t != null ? gt(t) || xt(t) || ye(t) ? { i: Ut, r: t, k: e, f: !!n } : t : null);
function w(t, e = null, n = null, s = 0, r = null, i = t === et ? 0 : 1, o = !1, a = !1) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: t,
    props: e,
    key: e && Wl(e),
    ref: e && hr(e),
    scopeId: wl,
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
    shapeFlag: i,
    patchFlag: s,
    dynamicProps: r,
    dynamicChildren: null,
    appContext: null,
    ctx: Ut
  };
  return a ? (oo(l, n), i & 128 && t.normalize(l)) : n && (l.shapeFlag |= gt(n) ? 8 : 16), Hs > 0 && // avoid a block node from tracking itself
  !o && // has current parent block
  Dt && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (l.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  l.patchFlag !== 32 && Dt.push(l), l;
}
const nn = Mf;
function Mf(t, e = null, n = null, s = 0, r = null, i = !1) {
  if ((!t || t === sf) && (t = In), ql(t)) {
    const a = ss(
      t,
      e,
      !0
      /* mergeRef: true */
    );
    return n && oo(a, n), Hs > 0 && !i && Dt && (a.shapeFlag & 6 ? Dt[Dt.indexOf(t)] = a : Dt.push(a)), a.patchFlag = -2, a;
  }
  if (Kf(t) && (t = t.__vccOpts), e) {
    e = Df(e);
    let { class: a, style: l } = e;
    a && !gt(a) && (e.class = Xe(a)), lt(l) && (eo(l) && !he(l) && (l = At({}, l)), e.style = Ae(l));
  }
  const o = gt(t) ? 1 : zl(t) ? 128 : Wu(t) ? 64 : lt(t) ? 4 : ye(t) ? 2 : 0;
  return w(
    t,
    e,
    n,
    s,
    r,
    o,
    i,
    !0
  );
}
function Df(t) {
  return t ? eo(t) || Il(t) ? At({}, t) : t : null;
}
function ss(t, e, n = !1, s = !1) {
  const { props: r, ref: i, patchFlag: o, children: a, transition: l } = t, h = e ? Bf(r || {}, e) : r, c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: t.type,
    props: h,
    key: h && Wl(h),
    ref: e && e.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && i ? he(i) ? i.concat(hr(e)) : [i, hr(e)] : hr(e)
    ) : i,
    scopeId: t.scopeId,
    slotScopeIds: t.slotScopeIds,
    children: a,
    target: t.target,
    targetStart: t.targetStart,
    targetAnchor: t.targetAnchor,
    staticCount: t.staticCount,
    shapeFlag: t.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: e && t.type !== et ? o === -1 ? 16 : o | 16 : o,
    dynamicProps: t.dynamicProps,
    dynamicChildren: t.dynamicChildren,
    appContext: t.appContext,
    dirs: t.dirs,
    transition: l,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: t.component,
    suspense: t.suspense,
    ssContent: t.ssContent && ss(t.ssContent),
    ssFallback: t.ssFallback && ss(t.ssFallback),
    placeholder: t.placeholder,
    el: t.el,
    anchor: t.anchor,
    ctx: t.ctx,
    ce: t.ce
  };
  return l && s && no(
    c,
    l.clone(c)
  ), c;
}
function cn(t = " ", e = 0) {
  return nn(zr, null, t, e);
}
function Dn(t, e) {
  const n = nn(fr, null, t);
  return n.staticCount = e, n;
}
function oe(t = "", e = !1) {
  return e ? (T(), Ff(In, null, t)) : nn(In, null, t);
}
function en(t) {
  return t == null || typeof t == "boolean" ? nn(In) : he(t) ? nn(
    et,
    null,
    // #3666, avoid reference pollution when reusing vnode
    t.slice()
  ) : ql(t) ? Tn(t) : nn(zr, null, String(t));
}
function Tn(t) {
  return t.el === null && t.patchFlag !== -1 || t.memo ? t : ss(t);
}
function oo(t, e) {
  let n = 0;
  const { shapeFlag: s } = t;
  if (e == null)
    e = null;
  else if (he(e))
    n = 16;
  else if (typeof e == "object")
    if (s & 65) {
      const r = e.default;
      r && (r._c && (r._d = !1), oo(t, r()), r._c && (r._d = !0));
      return;
    } else {
      n = 32;
      const r = e._;
      !r && !Il(e) ? e._ctx = Ut : r === 3 && Ut && (Ut.slots._ === 1 ? e._ = 1 : (e._ = 2, t.patchFlag |= 1024));
    }
  else ye(e) ? (e = { default: e, _ctx: Ut }, n = 32) : (e = String(e), s & 64 ? (n = 16, e = [cn(e)]) : n = 8);
  t.children = e, t.shapeFlag |= n;
}
function Bf(...t) {
  const e = {};
  for (let n = 0; n < t.length; n++) {
    const s = t[n];
    for (const r in s)
      if (r === "class")
        e.class !== s.class && (e.class = Xe([e.class, s.class]));
      else if (r === "style")
        e.style = Ae([e.style, s.style]);
      else if (Or(r)) {
        const i = e[r], o = s[r];
        o && i !== o && !(he(i) && i.includes(o)) && (e[r] = i ? [].concat(i, o) : o);
      } else r !== "" && (e[r] = s[r]);
  }
  return e;
}
function Zt(t, e, n, s = null) {
  rn(t, e, 7, [
    n,
    s
  ]);
}
const $f = El();
let Uf = 0;
function zf(t, e, n) {
  const s = t.type, r = (e ? e.appContext : t.appContext) || $f, i = {
    uid: Uf++,
    vnode: t,
    type: s,
    parent: e,
    appContext: r,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new uu(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: e ? e.provides : Object.create(r.provides),
    ids: e ? e.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: Ol(s, r),
    emitsOptions: Ul(s, r),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: Ze,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: Ze,
    data: Ze,
    props: Ze,
    attrs: Ze,
    slots: Ze,
    refs: Ze,
    setupState: Ze,
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
  return i.ctx = { _: i }, i.root = e ? e.root : i, i.emit = Cf.bind(null, i), t.ce && t.ce(i), i;
}
let Ct = null;
const Hf = () => Ct || Ut;
let Sr, Li;
{
  const t = Fr(), e = (n, s) => {
    let r;
    return (r = t[n]) || (r = t[n] = []), r.push(s), (i) => {
      r.length > 1 ? r.forEach((o) => o(i)) : r[0](i);
    };
  };
  Sr = e(
    "__VUE_INSTANCE_SETTERS__",
    (n) => Ct = n
  ), Li = e(
    "__VUE_SSR_SETTERS__",
    (n) => qs = n
  );
}
const Ks = (t) => {
  const e = Ct;
  return Sr(t), t.scope.on(), () => {
    t.scope.off(), Sr(e);
  };
}, oa = () => {
  Ct && Ct.scope.off(), Sr(null);
};
function jl(t) {
  return t.vnode.shapeFlag & 4;
}
let qs = !1;
function qf(t, e = !1, n = !1) {
  e && Li(e);
  const { props: s, children: r } = t.vnode, i = jl(t);
  pf(t, s, i, e), yf(t, r, n || e);
  const o = i ? Wf(t, e) : void 0;
  return e && Li(!1), o;
}
function Wf(t, e) {
  const n = t.type;
  t.accessCache = /* @__PURE__ */ Object.create(null), t.proxy = new Proxy(t.ctx, rf);
  const { setup: s } = n;
  if (s) {
    _n();
    const r = t.setupContext = s.length > 1 ? Vf(t) : null, i = Ks(t), o = js(
      s,
      t,
      0,
      [
        t.props,
        r
      ]
    ), a = Ga(o);
    if (yn(), i(), (a || t.sp) && !Fs(t) && kl(t), a) {
      if (o.then(oa, oa), e)
        return o.then((l) => {
          aa(t, l);
        }).catch((l) => {
          Br(l, t, 0);
        });
      t.asyncDep = o;
    } else
      aa(t, o);
  } else
    Vl(t);
}
function aa(t, e, n) {
  ye(e) ? t.type.__ssrInlineRender ? t.ssrRender = e : t.render = e : lt(e) && (t.setupState = ml(e)), Vl(t);
}
function Vl(t, e, n) {
  const s = t.type;
  t.render || (t.render = s.render || tn);
  {
    const r = Ks(t);
    _n();
    try {
      of(t);
    } finally {
      yn(), r();
    }
  }
}
const jf = {
  get(t, e) {
    return kt(t, "get", ""), t[e];
  }
};
function Vf(t) {
  const e = (n) => {
    t.exposed = n || {};
  };
  return {
    attrs: new Proxy(t.attrs, jf),
    slots: t.slots,
    emit: t.emit,
    expose: e
  };
}
function Hr(t) {
  return t.exposed ? t.exposeProxy || (t.exposeProxy = new Proxy(ml(Lu(t.exposed)), {
    get(e, n) {
      if (n in e)
        return e[n];
      if (n in Ms)
        return Ms[n](t);
    },
    has(e, n) {
      return n in e || n in Ms;
    }
  })) : t.proxy;
}
function Kf(t) {
  return ye(t) && "__vccOpts" in t;
}
const Ce = (t, e) => Mu(t, e, qs), Gf = "3.5.18";
/**
* @vue/runtime-dom v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Oi;
const la = typeof window < "u" && window.trustedTypes;
if (la)
  try {
    Oi = /* @__PURE__ */ la.createPolicy("vue", {
      createHTML: (t) => t
    });
  } catch {
  }
const Kl = Oi ? (t) => Oi.createHTML(t) : (t) => t, Yf = "http://www.w3.org/2000/svg", Xf = "http://www.w3.org/1998/Math/MathML", fn = typeof document < "u" ? document : null, ca = fn && /* @__PURE__ */ fn.createElement("template"), Zf = {
  insert: (t, e, n) => {
    e.insertBefore(t, n || null);
  },
  remove: (t) => {
    const e = t.parentNode;
    e && e.removeChild(t);
  },
  createElement: (t, e, n, s) => {
    const r = e === "svg" ? fn.createElementNS(Yf, t) : e === "mathml" ? fn.createElementNS(Xf, t) : n ? fn.createElement(t, { is: n }) : fn.createElement(t);
    return t === "select" && s && s.multiple != null && r.setAttribute("multiple", s.multiple), r;
  },
  createText: (t) => fn.createTextNode(t),
  createComment: (t) => fn.createComment(t),
  setText: (t, e) => {
    t.nodeValue = e;
  },
  setElementText: (t, e) => {
    t.textContent = e;
  },
  parentNode: (t) => t.parentNode,
  nextSibling: (t) => t.nextSibling,
  querySelector: (t) => fn.querySelector(t),
  setScopeId(t, e) {
    t.setAttribute(e, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(t, e, n, s, r, i) {
    const o = n ? n.previousSibling : e.lastChild;
    if (r && (r === i || r.nextSibling))
      for (; e.insertBefore(r.cloneNode(!0), n), !(r === i || !(r = r.nextSibling)); )
        ;
    else {
      ca.innerHTML = Kl(
        s === "svg" ? `<svg>${t}</svg>` : s === "mathml" ? `<math>${t}</math>` : t
      );
      const a = ca.content;
      if (s === "svg" || s === "mathml") {
        const l = a.firstChild;
        for (; l.firstChild; )
          a.appendChild(l.firstChild);
        a.removeChild(l);
      }
      e.insertBefore(a, n);
    }
    return [
      // first
      o ? o.nextSibling : e.firstChild,
      // last
      n ? n.previousSibling : e.lastChild
    ];
  }
}, Jf = Symbol("_vtc");
function Qf(t, e, n) {
  const s = t[Jf];
  s && (e = (e ? [e, ...s] : [...s]).join(" ")), e == null ? t.removeAttribute("class") : n ? t.setAttribute("class", e) : t.className = e;
}
const Er = Symbol("_vod"), Gl = Symbol("_vsh"), eh = {
  beforeMount(t, { value: e }, { transition: n }) {
    t[Er] = t.style.display === "none" ? "" : t.style.display, n && e ? n.beforeEnter(t) : _s(t, e);
  },
  mounted(t, { value: e }, { transition: n }) {
    n && e && n.enter(t);
  },
  updated(t, { value: e, oldValue: n }, { transition: s }) {
    !e != !n && (s ? e ? (s.beforeEnter(t), _s(t, !0), s.enter(t)) : s.leave(t, () => {
      _s(t, !1);
    }) : _s(t, e));
  },
  beforeUnmount(t, { value: e }) {
    _s(t, e);
  }
};
function _s(t, e) {
  t.style.display = e ? t[Er] : "none", t[Gl] = !e;
}
const th = Symbol(""), nh = /(^|;)\s*display\s*:/;
function sh(t, e, n) {
  const s = t.style, r = gt(n);
  let i = !1;
  if (n && !r) {
    if (e)
      if (gt(e))
        for (const o of e.split(";")) {
          const a = o.slice(0, o.indexOf(":")).trim();
          n[a] == null && dr(s, a, "");
        }
      else
        for (const o in e)
          n[o] == null && dr(s, o, "");
    for (const o in n)
      o === "display" && (i = !0), dr(s, o, n[o]);
  } else if (r) {
    if (e !== n) {
      const o = s[th];
      o && (n += ";" + o), s.cssText = n, i = nh.test(n);
    }
  } else e && t.removeAttribute("style");
  Er in t && (t[Er] = i ? s.display : "", t[Gl] && (s.display = "none"));
}
const ua = /\s*!important$/;
function dr(t, e, n) {
  if (he(n))
    n.forEach((s) => dr(t, e, s));
  else if (n == null && (n = ""), e.startsWith("--"))
    t.setProperty(e, n);
  else {
    const s = rh(t, e);
    ua.test(n) ? t.setProperty(
      On(s),
      n.replace(ua, ""),
      "important"
    ) : t[s] = n;
  }
}
const fa = ["Webkit", "Moz", "ms"], oi = {};
function rh(t, e) {
  const n = oi[e];
  if (n)
    return n;
  let s = Cn(e);
  if (s !== "filter" && s in t)
    return oi[e] = s;
  s = Za(s);
  for (let r = 0; r < fa.length; r++) {
    const i = fa[r] + s;
    if (i in t)
      return oi[e] = i;
  }
  return e;
}
const ha = "http://www.w3.org/1999/xlink";
function da(t, e, n, s, r, i = cu(e)) {
  s && e.startsWith("xlink:") ? n == null ? t.removeAttributeNS(ha, e.slice(6, e.length)) : t.setAttributeNS(ha, e, n) : n == null || i && !Ja(n) ? t.removeAttribute(e) : t.setAttribute(
    e,
    i ? "" : Ln(n) ? String(n) : n
  );
}
function pa(t, e, n, s, r) {
  if (e === "innerHTML" || e === "textContent") {
    n != null && (t[e] = e === "innerHTML" ? Kl(n) : n);
    return;
  }
  const i = t.tagName;
  if (e === "value" && i !== "PROGRESS" && // custom elements may use _value internally
  !i.includes("-")) {
    const a = i === "OPTION" ? t.getAttribute("value") || "" : t.value, l = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      t.type === "checkbox" ? "on" : ""
    ) : String(n);
    (a !== l || !("_value" in t)) && (t.value = l), n == null && t.removeAttribute(e), t._value = n;
    return;
  }
  let o = !1;
  if (n === "" || n == null) {
    const a = typeof t[e];
    a === "boolean" ? n = Ja(n) : n == null && a === "string" ? (n = "", o = !0) : a === "number" && (n = 0, o = !0);
  }
  try {
    t[e] = n;
  } catch {
  }
  o && t.removeAttribute(r || e);
}
function Xn(t, e, n, s) {
  t.addEventListener(e, n, s);
}
function ih(t, e, n, s) {
  t.removeEventListener(e, n, s);
}
const ga = Symbol("_vei");
function oh(t, e, n, s, r = null) {
  const i = t[ga] || (t[ga] = {}), o = i[e];
  if (s && o)
    o.value = s;
  else {
    const [a, l] = ah(e);
    if (s) {
      const h = i[e] = uh(
        s,
        r
      );
      Xn(t, a, h, l);
    } else o && (ih(t, a, o, l), i[e] = void 0);
  }
}
const ma = /(?:Once|Passive|Capture)$/;
function ah(t) {
  let e;
  if (ma.test(t)) {
    e = {};
    let s;
    for (; s = t.match(ma); )
      t = t.slice(0, t.length - s[0].length), e[s[0].toLowerCase()] = !0;
  }
  return [t[2] === ":" ? t.slice(3) : On(t.slice(2)), e];
}
let ai = 0;
const lh = /* @__PURE__ */ Promise.resolve(), ch = () => ai || (lh.then(() => ai = 0), ai = Date.now());
function uh(t, e) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    rn(
      fh(s, n.value),
      e,
      5,
      [s]
    );
  };
  return n.value = t, n.attached = ch(), n;
}
function fh(t, e) {
  if (he(e)) {
    const n = t.stopImmediatePropagation;
    return t.stopImmediatePropagation = () => {
      n.call(t), t._stopped = !0;
    }, e.map(
      (s) => (r) => !r._stopped && s && s(r)
    );
  } else
    return e;
}
const _a = (t) => t.charCodeAt(0) === 111 && t.charCodeAt(1) === 110 && // lowercase letter
t.charCodeAt(2) > 96 && t.charCodeAt(2) < 123, hh = (t, e, n, s, r, i) => {
  const o = r === "svg";
  e === "class" ? Qf(t, s, o) : e === "style" ? sh(t, n, s) : Or(e) ? ji(e) || oh(t, e, n, s, i) : (e[0] === "." ? (e = e.slice(1), !0) : e[0] === "^" ? (e = e.slice(1), !1) : dh(t, e, s, o)) ? (pa(t, e, s), !t.tagName.includes("-") && (e === "value" || e === "checked" || e === "selected") && da(t, e, s, o, i, e !== "value")) : /* #11081 force set props for possible async custom element */ t._isVueCE && (/[A-Z]/.test(e) || !gt(s)) ? pa(t, Cn(e), s, i, e) : (e === "true-value" ? t._trueValue = s : e === "false-value" && (t._falseValue = s), da(t, e, s, o));
};
function dh(t, e, n, s) {
  if (s)
    return !!(e === "innerHTML" || e === "textContent" || e in t && _a(e) && ye(n));
  if (e === "spellcheck" || e === "draggable" || e === "translate" || e === "autocorrect" || e === "form" || e === "list" && t.tagName === "INPUT" || e === "type" && t.tagName === "TEXTAREA")
    return !1;
  if (e === "width" || e === "height") {
    const r = t.tagName;
    if (r === "IMG" || r === "VIDEO" || r === "CANVAS" || r === "SOURCE")
      return !1;
  }
  return _a(e) && gt(n) ? !1 : e in t;
}
const ya = (t) => {
  const e = t.props["onUpdate:modelValue"] || !1;
  return he(e) ? (n) => cr(e, n) : e;
};
function ph(t) {
  t.target.composing = !0;
}
function va(t) {
  const e = t.target;
  e.composing && (e.composing = !1, e.dispatchEvent(new Event("input")));
}
const li = Symbol("_assign"), Bn = {
  created(t, { modifiers: { lazy: e, trim: n, number: s } }, r) {
    t[li] = ya(r);
    const i = s || r.props && r.props.type === "number";
    Xn(t, e ? "change" : "input", (o) => {
      if (o.target.composing) return;
      let a = t.value;
      n && (a = a.trim()), i && (a = wi(a)), t[li](a);
    }), n && Xn(t, "change", () => {
      t.value = t.value.trim();
    }), e || (Xn(t, "compositionstart", ph), Xn(t, "compositionend", va), Xn(t, "change", va));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(t, { value: e }) {
    t.value = e ?? "";
  },
  beforeUpdate(t, { value: e, oldValue: n, modifiers: { lazy: s, trim: r, number: i } }, o) {
    if (t[li] = ya(o), t.composing) return;
    const a = (i || t.type === "number") && !/^0\d/.test(t.value) ? wi(t.value) : t.value, l = e ?? "";
    a !== l && (document.activeElement === t && t.type !== "range" && (s && e === n || r && t.value.trim() === l) || (t.value = l));
  }
}, gh = ["ctrl", "shift", "alt", "meta"], mh = {
  stop: (t) => t.stopPropagation(),
  prevent: (t) => t.preventDefault(),
  self: (t) => t.target !== t.currentTarget,
  ctrl: (t) => !t.ctrlKey,
  shift: (t) => !t.shiftKey,
  alt: (t) => !t.altKey,
  meta: (t) => !t.metaKey,
  left: (t) => "button" in t && t.button !== 0,
  middle: (t) => "button" in t && t.button !== 1,
  right: (t) => "button" in t && t.button !== 2,
  exact: (t, e) => gh.some((n) => t[`${n}Key`] && !e.includes(n))
}, Gn = (t, e) => {
  const n = t._withMods || (t._withMods = {}), s = e.join(".");
  return n[s] || (n[s] = (r, ...i) => {
    for (let o = 0; o < e.length; o++) {
      const a = mh[e[o]];
      if (a && a(r, e)) return;
    }
    return t(r, ...i);
  });
}, _h = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, ci = (t, e) => {
  const n = t._withKeys || (t._withKeys = {}), s = e.join(".");
  return n[s] || (n[s] = (r) => {
    if (!("key" in r))
      return;
    const i = On(r.key);
    if (e.some(
      (o) => o === i || _h[o] === i
    ))
      return t(r);
  });
}, yh = /* @__PURE__ */ At({ patchProp: hh }, Zf);
let ba;
function vh() {
  return ba || (ba = bf(yh));
}
const bh = (...t) => {
  const e = vh().createApp(...t), { mount: n } = e;
  return e.mount = (s) => {
    const r = kh(s);
    if (!r) return;
    const i = e._component;
    !ye(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
    const o = n(r, !1, wh(r));
    return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), o;
  }, e;
};
function wh(t) {
  if (t instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && t instanceof MathMLElement)
    return "mathml";
}
function kh(t) {
  return gt(t) ? document.querySelector(t) : t;
}
const ns = (t) => {
  const e = t.replace("#", ""), n = parseInt(e.substr(0, 2), 16), s = parseInt(e.substr(2, 2), 16), r = parseInt(e.substr(4, 2), 16);
  return (n * 299 + s * 587 + r * 114) / 1e3 < 128;
}, xh = (t, e) => {
  const n = t.replace("#", ""), s = parseInt(n.substr(0, 2), 16), r = parseInt(n.substr(2, 2), 16), i = parseInt(n.substr(4, 2), 16), o = ns(t), a = o ? Math.min(255, s + e) : Math.max(0, s - e), l = o ? Math.min(255, r + e) : Math.max(0, r - e), h = o ? Math.min(255, i + e) : Math.max(0, i - e);
  return `#${a.toString(16).padStart(2, "0")}${l.toString(16).padStart(2, "0")}${h.toString(16).padStart(2, "0")}`;
}, ys = (t) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t), Ah = (t) => {
  switch (t.type) {
    case "connection_error":
      return "Unable to connect. Please try again later.";
    case "auth_error":
      return "Authentication failed. Please refresh the page.";
    case "chat_error":
      return "Unable to send message. Please try again.";
    case "ai_config_missing":
      return "Chat service is currently unavailable.";
    default:
      return t.error || "Something went wrong. Please try again.";
  }
};
function ao() {
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
var Hn = ao();
function Yl(t) {
  Hn = t;
}
var Bs = { exec: () => null };
function He(t, e = "") {
  let n = typeof t == "string" ? t : t.source;
  const s = {
    replace: (r, i) => {
      let o = typeof i == "string" ? i : i.source;
      return o = o.replace(Rt.caret, "$1"), n = n.replace(r, o), s;
    },
    getRegex: () => new RegExp(n, e)
  };
  return s;
}
var Rt = {
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
  listItemRegex: (t) => new RegExp(`^( {0,3}${t})((?:[	 ][^\\n]*)?(?:\\n|$))`),
  nextBulletRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
  hrRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
  fencesBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}(?:\`\`\`|~~~)`),
  headingBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}#`),
  htmlBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}<(?:[a-z].*>|!--)`, "i")
}, Th = /^(?:[ \t]*(?:\n|$))+/, Sh = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Eh = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Gs = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Ch = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, lo = /(?:[*+-]|\d{1,9}[.)])/, Xl = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, Zl = He(Xl).replace(/bull/g, lo).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Rh = He(Xl).replace(/bull/g, lo).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), co = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Ih = /^[^\n]+/, uo = /(?!\s*\])(?:\\.|[^\[\]\\])+/, Lh = He(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", uo).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Oh = He(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, lo).getRegex(), qr = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", fo = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Ph = He(
  "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))",
  "i"
).replace("comment", fo).replace("tag", qr).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Jl = He(co).replace("hr", Gs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", qr).getRegex(), Nh = He(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Jl).getRegex(), ho = {
  blockquote: Nh,
  code: Sh,
  def: Lh,
  fences: Eh,
  heading: Ch,
  hr: Gs,
  html: Ph,
  lheading: Zl,
  list: Oh,
  newline: Th,
  paragraph: Jl,
  table: Bs,
  text: Ih
}, wa = He(
  "^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
).replace("hr", Gs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", qr).getRegex(), Fh = {
  ...ho,
  lheading: Rh,
  table: wa,
  paragraph: He(co).replace("hr", Gs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", wa).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", qr).getRegex()
}, Mh = {
  ...ho,
  html: He(
    `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`
  ).replace("comment", fo).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Bs,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: He(co).replace("hr", Gs).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Zl).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Dh = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Bh = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Ql = /^( {2,}|\\)\n(?!\s*$)/, $h = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Wr = /[\p{P}\p{S}]/u, po = /[\s\p{P}\p{S}]/u, ec = /[^\s\p{P}\p{S}]/u, Uh = He(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, po).getRegex(), tc = /(?!~)[\p{P}\p{S}]/u, zh = /(?!~)[\s\p{P}\p{S}]/u, Hh = /(?:[^\s\p{P}\p{S}]|~)/u, qh = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, nc = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, Wh = He(nc, "u").replace(/punct/g, Wr).getRegex(), jh = He(nc, "u").replace(/punct/g, tc).getRegex(), sc = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", Vh = He(sc, "gu").replace(/notPunctSpace/g, ec).replace(/punctSpace/g, po).replace(/punct/g, Wr).getRegex(), Kh = He(sc, "gu").replace(/notPunctSpace/g, Hh).replace(/punctSpace/g, zh).replace(/punct/g, tc).getRegex(), Gh = He(
  "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)",
  "gu"
).replace(/notPunctSpace/g, ec).replace(/punctSpace/g, po).replace(/punct/g, Wr).getRegex(), Yh = He(/\\(punct)/, "gu").replace(/punct/g, Wr).getRegex(), Xh = He(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Zh = He(fo).replace("(?:-->|$)", "-->").getRegex(), Jh = He(
  "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>"
).replace("comment", Zh).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Cr = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Qh = He(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", Cr).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), rc = He(/^!?\[(label)\]\[(ref)\]/).replace("label", Cr).replace("ref", uo).getRegex(), ic = He(/^!?\[(ref)\](?:\[\])?/).replace("ref", uo).getRegex(), ed = He("reflink|nolink(?!\\()", "g").replace("reflink", rc).replace("nolink", ic).getRegex(), go = {
  _backpedal: Bs,
  // only used for GFM url
  anyPunctuation: Yh,
  autolink: Xh,
  blockSkip: qh,
  br: Ql,
  code: Bh,
  del: Bs,
  emStrongLDelim: Wh,
  emStrongRDelimAst: Vh,
  emStrongRDelimUnd: Gh,
  escape: Dh,
  link: Qh,
  nolink: ic,
  punctuation: Uh,
  reflink: rc,
  reflinkSearch: ed,
  tag: Jh,
  text: $h,
  url: Bs
}, td = {
  ...go,
  link: He(/^!?\[(label)\]\((.*?)\)/).replace("label", Cr).getRegex(),
  reflink: He(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Cr).getRegex()
}, Pi = {
  ...go,
  emStrongRDelimAst: Kh,
  emStrongLDelim: jh,
  url: He(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, nd = {
  ...Pi,
  br: He(Ql).replace("{2,}", "*").getRegex(),
  text: He(Pi.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, rr = {
  normal: ho,
  gfm: Fh,
  pedantic: Mh
}, vs = {
  normal: go,
  gfm: Pi,
  breaks: nd,
  pedantic: td
}, sd = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, ka = (t) => sd[t];
function Jt(t, e) {
  if (e) {
    if (Rt.escapeTest.test(t))
      return t.replace(Rt.escapeReplace, ka);
  } else if (Rt.escapeTestNoEncode.test(t))
    return t.replace(Rt.escapeReplaceNoEncode, ka);
  return t;
}
function xa(t) {
  try {
    t = encodeURI(t).replace(Rt.percentDecode, "%");
  } catch {
    return null;
  }
  return t;
}
function Aa(t, e) {
  var i;
  const n = t.replace(Rt.findPipe, (o, a, l) => {
    let h = !1, c = a;
    for (; --c >= 0 && l[c] === "\\"; ) h = !h;
    return h ? "|" : " |";
  }), s = n.split(Rt.splitPipe);
  let r = 0;
  if (s[0].trim() || s.shift(), s.length > 0 && !((i = s.at(-1)) != null && i.trim()) && s.pop(), e)
    if (s.length > e)
      s.splice(e);
    else
      for (; s.length < e; ) s.push("");
  for (; r < s.length; r++)
    s[r] = s[r].trim().replace(Rt.slashPipe, "|");
  return s;
}
function bs(t, e, n) {
  const s = t.length;
  if (s === 0)
    return "";
  let r = 0;
  for (; r < s && t.charAt(s - r - 1) === e; )
    r++;
  return t.slice(0, s - r);
}
function rd(t, e) {
  if (t.indexOf(e[1]) === -1)
    return -1;
  let n = 0;
  for (let s = 0; s < t.length; s++)
    if (t[s] === "\\")
      s++;
    else if (t[s] === e[0])
      n++;
    else if (t[s] === e[1] && (n--, n < 0))
      return s;
  return n > 0 ? -2 : -1;
}
function Ta(t, e, n, s, r) {
  const i = e.href, o = e.title || null, a = t[1].replace(r.other.outputLinkReplace, "$1");
  s.state.inLink = !0;
  const l = {
    type: t[0].charAt(0) === "!" ? "image" : "link",
    raw: n,
    href: i,
    title: o,
    text: a,
    tokens: s.inlineTokens(a)
  };
  return s.state.inLink = !1, l;
}
function id(t, e, n) {
  const s = t.match(n.other.indentCodeCompensation);
  if (s === null)
    return e;
  const r = s[1];
  return e.split(`
`).map((i) => {
    const o = i.match(n.other.beginningSpace);
    if (o === null)
      return i;
    const [a] = o;
    return a.length >= r.length ? i.slice(r.length) : i;
  }).join(`
`);
}
var Rr = class {
  // set by the lexer
  constructor(t) {
    Ye(this, "options");
    Ye(this, "rules");
    // set by the lexer
    Ye(this, "lexer");
    this.options = t || Hn;
  }
  space(t) {
    const e = this.rules.block.newline.exec(t);
    if (e && e[0].length > 0)
      return {
        type: "space",
        raw: e[0]
      };
  }
  code(t) {
    const e = this.rules.block.code.exec(t);
    if (e) {
      const n = e[0].replace(this.rules.other.codeRemoveIndent, "");
      return {
        type: "code",
        raw: e[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? n : bs(n, `
`)
      };
    }
  }
  fences(t) {
    const e = this.rules.block.fences.exec(t);
    if (e) {
      const n = e[0], s = id(n, e[3] || "", this.rules);
      return {
        type: "code",
        raw: n,
        lang: e[2] ? e[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : e[2],
        text: s
      };
    }
  }
  heading(t) {
    const e = this.rules.block.heading.exec(t);
    if (e) {
      let n = e[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        const s = bs(n, "#");
        (this.options.pedantic || !s || this.rules.other.endingSpaceChar.test(s)) && (n = s.trim());
      }
      return {
        type: "heading",
        raw: e[0],
        depth: e[1].length,
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  hr(t) {
    const e = this.rules.block.hr.exec(t);
    if (e)
      return {
        type: "hr",
        raw: bs(e[0], `
`)
      };
  }
  blockquote(t) {
    const e = this.rules.block.blockquote.exec(t);
    if (e) {
      let n = bs(e[0], `
`).split(`
`), s = "", r = "";
      const i = [];
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
        const h = a.join(`
`), c = h.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        s = s ? `${s}
${h}` : h, r = r ? `${r}
${c}` : c;
        const b = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(c, i, !0), this.lexer.state.top = b, n.length === 0)
          break;
        const m = i.at(-1);
        if ((m == null ? void 0 : m.type) === "code")
          break;
        if ((m == null ? void 0 : m.type) === "blockquote") {
          const P = m, $ = P.raw + `
` + n.join(`
`), j = this.blockquote($);
          i[i.length - 1] = j, s = s.substring(0, s.length - P.raw.length) + j.raw, r = r.substring(0, r.length - P.text.length) + j.text;
          break;
        } else if ((m == null ? void 0 : m.type) === "list") {
          const P = m, $ = P.raw + `
` + n.join(`
`), j = this.list($);
          i[i.length - 1] = j, s = s.substring(0, s.length - m.raw.length) + j.raw, r = r.substring(0, r.length - P.raw.length) + j.raw, n = $.substring(i.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return {
        type: "blockquote",
        raw: s,
        tokens: i,
        text: r
      };
    }
  }
  list(t) {
    let e = this.rules.block.list.exec(t);
    if (e) {
      let n = e[1].trim();
      const s = n.length > 1, r = {
        type: "list",
        raw: "",
        ordered: s,
        start: s ? +n.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
      const i = this.rules.other.listItemRegex(n);
      let o = !1;
      for (; t; ) {
        let l = !1, h = "", c = "";
        if (!(e = i.exec(t)) || this.rules.block.hr.test(t))
          break;
        h = e[0], t = t.substring(h.length);
        let b = e[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (te) => " ".repeat(3 * te.length)), m = t.split(`
`, 1)[0], P = !b.trim(), $ = 0;
        if (this.options.pedantic ? ($ = 2, c = b.trimStart()) : P ? $ = e[1].length + 1 : ($ = e[2].search(this.rules.other.nonSpaceChar), $ = $ > 4 ? 1 : $, c = b.slice($), $ += e[1].length), P && this.rules.other.blankLine.test(m) && (h += m + `
`, t = t.substring(m.length + 1), l = !0), !l) {
          const te = this.rules.other.nextBulletRegex($), Re = this.rules.other.hrRegex($), xe = this.rules.other.fencesBeginRegex($), z = this.rules.other.headingBeginRegex($), W = this.rules.other.htmlBeginRegex($);
          for (; t; ) {
            const ne = t.split(`
`, 1)[0];
            let V;
            if (m = ne, this.options.pedantic ? (m = m.replace(this.rules.other.listReplaceNesting, "  "), V = m) : V = m.replace(this.rules.other.tabCharGlobal, "    "), xe.test(m) || z.test(m) || W.test(m) || te.test(m) || Re.test(m))
              break;
            if (V.search(this.rules.other.nonSpaceChar) >= $ || !m.trim())
              c += `
` + V.slice($);
            else {
              if (P || b.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || xe.test(b) || z.test(b) || Re.test(b))
                break;
              c += `
` + m;
            }
            !P && !m.trim() && (P = !0), h += ne + `
`, t = t.substring(ne.length + 1), b = V.slice($);
          }
        }
        r.loose || (o ? r.loose = !0 : this.rules.other.doubleBlankLine.test(h) && (o = !0));
        let j = null, Le;
        this.options.gfm && (j = this.rules.other.listIsTask.exec(c), j && (Le = j[0] !== "[ ] ", c = c.replace(this.rules.other.listReplaceTask, ""))), r.items.push({
          type: "list_item",
          raw: h,
          task: !!j,
          checked: Le,
          loose: !1,
          text: c,
          tokens: []
        }), r.raw += h;
      }
      const a = r.items.at(-1);
      if (a)
        a.raw = a.raw.trimEnd(), a.text = a.text.trimEnd();
      else
        return;
      r.raw = r.raw.trimEnd();
      for (let l = 0; l < r.items.length; l++)
        if (this.lexer.state.top = !1, r.items[l].tokens = this.lexer.blockTokens(r.items[l].text, []), !r.loose) {
          const h = r.items[l].tokens.filter((b) => b.type === "space"), c = h.length > 0 && h.some((b) => this.rules.other.anyLine.test(b.raw));
          r.loose = c;
        }
      if (r.loose)
        for (let l = 0; l < r.items.length; l++)
          r.items[l].loose = !0;
      return r;
    }
  }
  html(t) {
    const e = this.rules.block.html.exec(t);
    if (e)
      return {
        type: "html",
        block: !0,
        raw: e[0],
        pre: e[1] === "pre" || e[1] === "script" || e[1] === "style",
        text: e[0]
      };
  }
  def(t) {
    const e = this.rules.block.def.exec(t);
    if (e) {
      const n = e[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), s = e[2] ? e[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = e[3] ? e[3].substring(1, e[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : e[3];
      return {
        type: "def",
        tag: n,
        raw: e[0],
        href: s,
        title: r
      };
    }
  }
  table(t) {
    var o;
    const e = this.rules.block.table.exec(t);
    if (!e || !this.rules.other.tableDelimiter.test(e[2]))
      return;
    const n = Aa(e[1]), s = e[2].replace(this.rules.other.tableAlignChars, "").split("|"), r = (o = e[3]) != null && o.trim() ? e[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], i = {
      type: "table",
      raw: e[0],
      header: [],
      align: [],
      rows: []
    };
    if (n.length === s.length) {
      for (const a of s)
        this.rules.other.tableAlignRight.test(a) ? i.align.push("right") : this.rules.other.tableAlignCenter.test(a) ? i.align.push("center") : this.rules.other.tableAlignLeft.test(a) ? i.align.push("left") : i.align.push(null);
      for (let a = 0; a < n.length; a++)
        i.header.push({
          text: n[a],
          tokens: this.lexer.inline(n[a]),
          header: !0,
          align: i.align[a]
        });
      for (const a of r)
        i.rows.push(Aa(a, i.header.length).map((l, h) => ({
          text: l,
          tokens: this.lexer.inline(l),
          header: !1,
          align: i.align[h]
        })));
      return i;
    }
  }
  lheading(t) {
    const e = this.rules.block.lheading.exec(t);
    if (e)
      return {
        type: "heading",
        raw: e[0],
        depth: e[2].charAt(0) === "=" ? 1 : 2,
        text: e[1],
        tokens: this.lexer.inline(e[1])
      };
  }
  paragraph(t) {
    const e = this.rules.block.paragraph.exec(t);
    if (e) {
      const n = e[1].charAt(e[1].length - 1) === `
` ? e[1].slice(0, -1) : e[1];
      return {
        type: "paragraph",
        raw: e[0],
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  text(t) {
    const e = this.rules.block.text.exec(t);
    if (e)
      return {
        type: "text",
        raw: e[0],
        text: e[0],
        tokens: this.lexer.inline(e[0])
      };
  }
  escape(t) {
    const e = this.rules.inline.escape.exec(t);
    if (e)
      return {
        type: "escape",
        raw: e[0],
        text: e[1]
      };
  }
  tag(t) {
    const e = this.rules.inline.tag.exec(t);
    if (e)
      return !this.lexer.state.inLink && this.rules.other.startATag.test(e[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(e[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(e[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(e[0]) && (this.lexer.state.inRawBlock = !1), {
        type: "html",
        raw: e[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        block: !1,
        text: e[0]
      };
  }
  link(t) {
    const e = this.rules.inline.link.exec(t);
    if (e) {
      const n = e[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
        if (!this.rules.other.endAngleBracket.test(n))
          return;
        const i = bs(n.slice(0, -1), "\\");
        if ((n.length - i.length) % 2 === 0)
          return;
      } else {
        const i = rd(e[2], "()");
        if (i === -2)
          return;
        if (i > -1) {
          const a = (e[0].indexOf("!") === 0 ? 5 : 4) + e[1].length + i;
          e[2] = e[2].substring(0, i), e[0] = e[0].substring(0, a).trim(), e[3] = "";
        }
      }
      let s = e[2], r = "";
      if (this.options.pedantic) {
        const i = this.rules.other.pedanticHrefTitle.exec(s);
        i && (s = i[1], r = i[3]);
      } else
        r = e[3] ? e[3].slice(1, -1) : "";
      return s = s.trim(), this.rules.other.startAngleBracket.test(s) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), Ta(e, {
        href: s && s.replace(this.rules.inline.anyPunctuation, "$1"),
        title: r && r.replace(this.rules.inline.anyPunctuation, "$1")
      }, e[0], this.lexer, this.rules);
    }
  }
  reflink(t, e) {
    let n;
    if ((n = this.rules.inline.reflink.exec(t)) || (n = this.rules.inline.nolink.exec(t))) {
      const s = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), r = e[s.toLowerCase()];
      if (!r) {
        const i = n[0].charAt(0);
        return {
          type: "text",
          raw: i,
          text: i
        };
      }
      return Ta(n, r, n[0], this.lexer, this.rules);
    }
  }
  emStrong(t, e, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(t);
    if (!s || s[3] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
    if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const i = [...s[0]].length - 1;
      let o, a, l = i, h = 0;
      const c = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c.lastIndex = 0, e = e.slice(-1 * t.length + i); (s = c.exec(e)) != null; ) {
        if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o) continue;
        if (a = [...o].length, s[3] || s[4]) {
          l += a;
          continue;
        } else if ((s[5] || s[6]) && i % 3 && !((i + a) % 3)) {
          h += a;
          continue;
        }
        if (l -= a, l > 0) continue;
        a = Math.min(a, a + l + h);
        const b = [...s[0]][0].length, m = t.slice(0, i + s.index + b + a);
        if (Math.min(i, a) % 2) {
          const $ = m.slice(1, -1);
          return {
            type: "em",
            raw: m,
            text: $,
            tokens: this.lexer.inlineTokens($)
          };
        }
        const P = m.slice(2, -2);
        return {
          type: "strong",
          raw: m,
          text: P,
          tokens: this.lexer.inlineTokens(P)
        };
      }
    }
  }
  codespan(t) {
    const e = this.rules.inline.code.exec(t);
    if (e) {
      let n = e[2].replace(this.rules.other.newLineCharGlobal, " ");
      const s = this.rules.other.nonSpaceChar.test(n), r = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return s && r && (n = n.substring(1, n.length - 1)), {
        type: "codespan",
        raw: e[0],
        text: n
      };
    }
  }
  br(t) {
    const e = this.rules.inline.br.exec(t);
    if (e)
      return {
        type: "br",
        raw: e[0]
      };
  }
  del(t) {
    const e = this.rules.inline.del.exec(t);
    if (e)
      return {
        type: "del",
        raw: e[0],
        text: e[2],
        tokens: this.lexer.inlineTokens(e[2])
      };
  }
  autolink(t) {
    const e = this.rules.inline.autolink.exec(t);
    if (e) {
      let n, s;
      return e[2] === "@" ? (n = e[1], s = "mailto:" + n) : (n = e[1], s = n), {
        type: "link",
        raw: e[0],
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
  url(t) {
    var n;
    let e;
    if (e = this.rules.inline.url.exec(t)) {
      let s, r;
      if (e[2] === "@")
        s = e[0], r = "mailto:" + s;
      else {
        let i;
        do
          i = e[0], e[0] = ((n = this.rules.inline._backpedal.exec(e[0])) == null ? void 0 : n[0]) ?? "";
        while (i !== e[0]);
        s = e[0], e[1] === "www." ? r = "http://" + e[0] : r = e[0];
      }
      return {
        type: "link",
        raw: e[0],
        text: s,
        href: r,
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
  inlineText(t) {
    const e = this.rules.inline.text.exec(t);
    if (e) {
      const n = this.lexer.state.inRawBlock;
      return {
        type: "text",
        raw: e[0],
        text: e[0],
        escaped: n
      };
    }
  }
}, gn = class Ni {
  constructor(e) {
    Ye(this, "tokens");
    Ye(this, "options");
    Ye(this, "state");
    Ye(this, "tokenizer");
    Ye(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || Hn, this.options.tokenizer = this.options.tokenizer || new Rr(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      other: Rt,
      block: rr.normal,
      inline: vs.normal
    };
    this.options.pedantic ? (n.block = rr.pedantic, n.inline = vs.pedantic) : this.options.gfm && (n.block = rr.gfm, this.options.breaks ? n.inline = vs.breaks : n.inline = vs.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: rr,
      inline: vs
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, n) {
    return new Ni(n).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, n) {
    return new Ni(n).inlineTokens(e);
  }
  /**
   * Preprocessing
   */
  lex(e) {
    e = e.replace(Rt.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let n = 0; n < this.inlineQueue.length; n++) {
      const s = this.inlineQueue[n];
      this.inlineTokens(s.src, s.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, n = [], s = !1) {
    var r, i, o;
    for (this.options.pedantic && (e = e.replace(Rt.tabCharGlobal, "    ").replace(Rt.spaceLine, "")); e; ) {
      let a;
      if ((i = (r = this.options.extensions) == null ? void 0 : r.block) != null && i.some((h) => (a = h.call({ lexer: this }, e, n)) ? (e = e.substring(a.raw.length), n.push(a), !0) : !1))
        continue;
      if (a = this.tokenizer.space(e)) {
        e = e.substring(a.raw.length);
        const h = n.at(-1);
        a.raw.length === 1 && h !== void 0 ? h.raw += `
` : n.push(a);
        continue;
      }
      if (a = this.tokenizer.code(e)) {
        e = e.substring(a.raw.length);
        const h = n.at(-1);
        (h == null ? void 0 : h.type) === "paragraph" || (h == null ? void 0 : h.type) === "text" ? (h.raw += `
` + a.raw, h.text += `
` + a.text, this.inlineQueue.at(-1).src = h.text) : n.push(a);
        continue;
      }
      if (a = this.tokenizer.fences(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.heading(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.hr(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.blockquote(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.list(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.html(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.def(e)) {
        e = e.substring(a.raw.length);
        const h = n.at(-1);
        (h == null ? void 0 : h.type) === "paragraph" || (h == null ? void 0 : h.type) === "text" ? (h.raw += `
` + a.raw, h.text += `
` + a.raw, this.inlineQueue.at(-1).src = h.text) : this.tokens.links[a.tag] || (this.tokens.links[a.tag] = {
          href: a.href,
          title: a.title
        });
        continue;
      }
      if (a = this.tokenizer.table(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.lheading(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      let l = e;
      if ((o = this.options.extensions) != null && o.startBlock) {
        let h = 1 / 0;
        const c = e.slice(1);
        let b;
        this.options.extensions.startBlock.forEach((m) => {
          b = m.call({ lexer: this }, c), typeof b == "number" && b >= 0 && (h = Math.min(h, b));
        }), h < 1 / 0 && h >= 0 && (l = e.substring(0, h + 1));
      }
      if (this.state.top && (a = this.tokenizer.paragraph(l))) {
        const h = n.at(-1);
        s && (h == null ? void 0 : h.type) === "paragraph" ? (h.raw += `
` + a.raw, h.text += `
` + a.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = h.text) : n.push(a), s = l.length !== e.length, e = e.substring(a.raw.length);
        continue;
      }
      if (a = this.tokenizer.text(e)) {
        e = e.substring(a.raw.length);
        const h = n.at(-1);
        (h == null ? void 0 : h.type) === "text" ? (h.raw += `
` + a.raw, h.text += `
` + a.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = h.text) : n.push(a);
        continue;
      }
      if (e) {
        const h = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(h);
          break;
        } else
          throw new Error(h);
      }
    }
    return this.state.top = !0, n;
  }
  inline(e, n = []) {
    return this.inlineQueue.push({ src: e, tokens: n }), n;
  }
  /**
   * Lexing/Compiling
   */
  inlineTokens(e, n = []) {
    var a, l, h;
    let s = e, r = null;
    if (this.tokens.links) {
      const c = Object.keys(this.tokens.links);
      if (c.length > 0)
        for (; (r = this.tokenizer.rules.inline.reflinkSearch.exec(s)) != null; )
          c.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (s = s.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + s.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (r = this.tokenizer.rules.inline.anyPunctuation.exec(s)) != null; )
      s = s.slice(0, r.index) + "++" + s.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; (r = this.tokenizer.rules.inline.blockSkip.exec(s)) != null; )
      s = s.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + s.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    let i = !1, o = "";
    for (; e; ) {
      i || (o = ""), i = !1;
      let c;
      if ((l = (a = this.options.extensions) == null ? void 0 : a.inline) != null && l.some((m) => (c = m.call({ lexer: this }, e, n)) ? (e = e.substring(c.raw.length), n.push(c), !0) : !1))
        continue;
      if (c = this.tokenizer.escape(e)) {
        e = e.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.tag(e)) {
        e = e.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.link(e)) {
        e = e.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(c.raw.length);
        const m = n.at(-1);
        c.type === "text" && (m == null ? void 0 : m.type) === "text" ? (m.raw += c.raw, m.text += c.text) : n.push(c);
        continue;
      }
      if (c = this.tokenizer.emStrong(e, s, o)) {
        e = e.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.codespan(e)) {
        e = e.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.br(e)) {
        e = e.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.del(e)) {
        e = e.substring(c.raw.length), n.push(c);
        continue;
      }
      if (c = this.tokenizer.autolink(e)) {
        e = e.substring(c.raw.length), n.push(c);
        continue;
      }
      if (!this.state.inLink && (c = this.tokenizer.url(e))) {
        e = e.substring(c.raw.length), n.push(c);
        continue;
      }
      let b = e;
      if ((h = this.options.extensions) != null && h.startInline) {
        let m = 1 / 0;
        const P = e.slice(1);
        let $;
        this.options.extensions.startInline.forEach((j) => {
          $ = j.call({ lexer: this }, P), typeof $ == "number" && $ >= 0 && (m = Math.min(m, $));
        }), m < 1 / 0 && m >= 0 && (b = e.substring(0, m + 1));
      }
      if (c = this.tokenizer.inlineText(b)) {
        e = e.substring(c.raw.length), c.raw.slice(-1) !== "_" && (o = c.raw.slice(-1)), i = !0;
        const m = n.at(-1);
        (m == null ? void 0 : m.type) === "text" ? (m.raw += c.raw, m.text += c.text) : n.push(c);
        continue;
      }
      if (e) {
        const m = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(m);
          break;
        } else
          throw new Error(m);
      }
    }
    return n;
  }
}, Ir = class {
  // set by the parser
  constructor(t) {
    Ye(this, "options");
    Ye(this, "parser");
    this.options = t || Hn;
  }
  space(t) {
    return "";
  }
  code({ text: t, lang: e, escaped: n }) {
    var i;
    const s = (i = (e || "").match(Rt.notSpaceStart)) == null ? void 0 : i[0], r = t.replace(Rt.endingNewline, "") + `
`;
    return s ? '<pre><code class="language-' + Jt(s) + '">' + (n ? r : Jt(r, !0)) + `</code></pre>
` : "<pre><code>" + (n ? r : Jt(r, !0)) + `</code></pre>
`;
  }
  blockquote({ tokens: t }) {
    return `<blockquote>
${this.parser.parse(t)}</blockquote>
`;
  }
  html({ text: t }) {
    return t;
  }
  heading({ tokens: t, depth: e }) {
    return `<h${e}>${this.parser.parseInline(t)}</h${e}>
`;
  }
  hr(t) {
    return `<hr>
`;
  }
  list(t) {
    const e = t.ordered, n = t.start;
    let s = "";
    for (let o = 0; o < t.items.length; o++) {
      const a = t.items[o];
      s += this.listitem(a);
    }
    const r = e ? "ol" : "ul", i = e && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + r + i + `>
` + s + "</" + r + `>
`;
  }
  listitem(t) {
    var n;
    let e = "";
    if (t.task) {
      const s = this.checkbox({ checked: !!t.checked });
      t.loose ? ((n = t.tokens[0]) == null ? void 0 : n.type) === "paragraph" ? (t.tokens[0].text = s + " " + t.tokens[0].text, t.tokens[0].tokens && t.tokens[0].tokens.length > 0 && t.tokens[0].tokens[0].type === "text" && (t.tokens[0].tokens[0].text = s + " " + Jt(t.tokens[0].tokens[0].text), t.tokens[0].tokens[0].escaped = !0)) : t.tokens.unshift({
        type: "text",
        raw: s + " ",
        text: s + " ",
        escaped: !0
      }) : e += s + " ";
    }
    return e += this.parser.parse(t.tokens, !!t.loose), `<li>${e}</li>
`;
  }
  checkbox({ checked: t }) {
    return "<input " + (t ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph({ tokens: t }) {
    return `<p>${this.parser.parseInline(t)}</p>
`;
  }
  table(t) {
    let e = "", n = "";
    for (let r = 0; r < t.header.length; r++)
      n += this.tablecell(t.header[r]);
    e += this.tablerow({ text: n });
    let s = "";
    for (let r = 0; r < t.rows.length; r++) {
      const i = t.rows[r];
      n = "";
      for (let o = 0; o < i.length; o++)
        n += this.tablecell(i[o]);
      s += this.tablerow({ text: n });
    }
    return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + e + `</thead>
` + s + `</table>
`;
  }
  tablerow({ text: t }) {
    return `<tr>
${t}</tr>
`;
  }
  tablecell(t) {
    const e = this.parser.parseInline(t.tokens), n = t.header ? "th" : "td";
    return (t.align ? `<${n} align="${t.align}">` : `<${n}>`) + e + `</${n}>
`;
  }
  /**
   * span level renderer
   */
  strong({ tokens: t }) {
    return `<strong>${this.parser.parseInline(t)}</strong>`;
  }
  em({ tokens: t }) {
    return `<em>${this.parser.parseInline(t)}</em>`;
  }
  codespan({ text: t }) {
    return `<code>${Jt(t, !0)}</code>`;
  }
  br(t) {
    return "<br>";
  }
  del({ tokens: t }) {
    return `<del>${this.parser.parseInline(t)}</del>`;
  }
  link({ href: t, title: e, tokens: n }) {
    const s = this.parser.parseInline(n), r = xa(t);
    if (r === null)
      return s;
    t = r;
    let i = '<a href="' + t + '"';
    return e && (i += ' title="' + Jt(e) + '"'), i += ">" + s + "</a>", i;
  }
  image({ href: t, title: e, text: n, tokens: s }) {
    s && (n = this.parser.parseInline(s, this.parser.textRenderer));
    const r = xa(t);
    if (r === null)
      return Jt(n);
    t = r;
    let i = `<img src="${t}" alt="${n}"`;
    return e && (i += ` title="${Jt(e)}"`), i += ">", i;
  }
  text(t) {
    return "tokens" in t && t.tokens ? this.parser.parseInline(t.tokens) : "escaped" in t && t.escaped ? t.text : Jt(t.text);
  }
}, mo = class {
  // no need for block level renderers
  strong({ text: t }) {
    return t;
  }
  em({ text: t }) {
    return t;
  }
  codespan({ text: t }) {
    return t;
  }
  del({ text: t }) {
    return t;
  }
  html({ text: t }) {
    return t;
  }
  text({ text: t }) {
    return t;
  }
  link({ text: t }) {
    return "" + t;
  }
  image({ text: t }) {
    return "" + t;
  }
  br() {
    return "";
  }
}, mn = class Fi {
  constructor(e) {
    Ye(this, "options");
    Ye(this, "renderer");
    Ye(this, "textRenderer");
    this.options = e || Hn, this.options.renderer = this.options.renderer || new Ir(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new mo();
  }
  /**
   * Static Parse Method
   */
  static parse(e, n) {
    return new Fi(n).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, n) {
    return new Fi(n).parseInline(e);
  }
  /**
   * Parse Loop
   */
  parse(e, n = !0) {
    var r, i;
    let s = "";
    for (let o = 0; o < e.length; o++) {
      const a = e[o];
      if ((i = (r = this.options.extensions) == null ? void 0 : r.renderers) != null && i[a.type]) {
        const h = a, c = this.options.extensions.renderers[h.type].call({ parser: this }, h);
        if (c !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(h.type)) {
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
          let h = l, c = this.renderer.text(h);
          for (; o + 1 < e.length && e[o + 1].type === "text"; )
            h = e[++o], c += `
` + this.renderer.text(h);
          n ? s += this.renderer.paragraph({
            type: "paragraph",
            raw: c,
            text: c,
            tokens: [{ type: "text", raw: c, text: c, escaped: !0 }]
          }) : s += c;
          continue;
        }
        default: {
          const h = 'Token with "' + l.type + '" type was not found.';
          if (this.options.silent)
            return console.error(h), "";
          throw new Error(h);
        }
      }
    }
    return s;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(e, n = this.renderer) {
    var r, i;
    let s = "";
    for (let o = 0; o < e.length; o++) {
      const a = e[o];
      if ((i = (r = this.options.extensions) == null ? void 0 : r.renderers) != null && i[a.type]) {
        const h = this.options.extensions.renderers[a.type].call({ parser: this }, a);
        if (h !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(a.type)) {
          s += h || "";
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
          const h = 'Token with "' + l.type + '" type was not found.';
          if (this.options.silent)
            return console.error(h), "";
          throw new Error(h);
        }
      }
    }
    return s;
  }
}, vi, pr = (vi = class {
  constructor(t) {
    Ye(this, "options");
    Ye(this, "block");
    this.options = t || Hn;
  }
  /**
   * Process markdown before marked
   */
  preprocess(t) {
    return t;
  }
  /**
   * Process HTML after marked is finished
   */
  postprocess(t) {
    return t;
  }
  /**
   * Process all tokens before walk tokens
   */
  processAllTokens(t) {
    return t;
  }
  /**
   * Provide function to tokenize markdown
   */
  provideLexer() {
    return this.block ? gn.lex : gn.lexInline;
  }
  /**
   * Provide function to parse tokens
   */
  provideParser() {
    return this.block ? mn.parse : mn.parseInline;
  }
}, Ye(vi, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
])), vi), od = class {
  constructor(...t) {
    Ye(this, "defaults", ao());
    Ye(this, "options", this.setOptions);
    Ye(this, "parse", this.parseMarkdown(!0));
    Ye(this, "parseInline", this.parseMarkdown(!1));
    Ye(this, "Parser", mn);
    Ye(this, "Renderer", Ir);
    Ye(this, "TextRenderer", mo);
    Ye(this, "Lexer", gn);
    Ye(this, "Tokenizer", Rr);
    Ye(this, "Hooks", pr);
    this.use(...t);
  }
  /**
   * Run callback for every token
   */
  walkTokens(t, e) {
    var s, r;
    let n = [];
    for (const i of t)
      switch (n = n.concat(e.call(this, i)), i.type) {
        case "table": {
          const o = i;
          for (const a of o.header)
            n = n.concat(this.walkTokens(a.tokens, e));
          for (const a of o.rows)
            for (const l of a)
              n = n.concat(this.walkTokens(l.tokens, e));
          break;
        }
        case "list": {
          const o = i;
          n = n.concat(this.walkTokens(o.items, e));
          break;
        }
        default: {
          const o = i;
          (r = (s = this.defaults.extensions) == null ? void 0 : s.childTokens) != null && r[o.type] ? this.defaults.extensions.childTokens[o.type].forEach((a) => {
            const l = o[a].flat(1 / 0);
            n = n.concat(this.walkTokens(l, e));
          }) : o.tokens && (n = n.concat(this.walkTokens(o.tokens, e)));
        }
      }
    return n;
  }
  use(...t) {
    const e = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return t.forEach((n) => {
      const s = { ...n };
      if (s.async = this.defaults.async || s.async || !1, n.extensions && (n.extensions.forEach((r) => {
        if (!r.name)
          throw new Error("extension name required");
        if ("renderer" in r) {
          const i = e.renderers[r.name];
          i ? e.renderers[r.name] = function(...o) {
            let a = r.renderer.apply(this, o);
            return a === !1 && (a = i.apply(this, o)), a;
          } : e.renderers[r.name] = r.renderer;
        }
        if ("tokenizer" in r) {
          if (!r.level || r.level !== "block" && r.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const i = e[r.level];
          i ? i.unshift(r.tokenizer) : e[r.level] = [r.tokenizer], r.start && (r.level === "block" ? e.startBlock ? e.startBlock.push(r.start) : e.startBlock = [r.start] : r.level === "inline" && (e.startInline ? e.startInline.push(r.start) : e.startInline = [r.start]));
        }
        "childTokens" in r && r.childTokens && (e.childTokens[r.name] = r.childTokens);
      }), s.extensions = e), n.renderer) {
        const r = this.defaults.renderer || new Ir(this.defaults);
        for (const i in n.renderer) {
          if (!(i in r))
            throw new Error(`renderer '${i}' does not exist`);
          if (["options", "parser"].includes(i))
            continue;
          const o = i, a = n.renderer[o], l = r[o];
          r[o] = (...h) => {
            let c = a.apply(r, h);
            return c === !1 && (c = l.apply(r, h)), c || "";
          };
        }
        s.renderer = r;
      }
      if (n.tokenizer) {
        const r = this.defaults.tokenizer || new Rr(this.defaults);
        for (const i in n.tokenizer) {
          if (!(i in r))
            throw new Error(`tokenizer '${i}' does not exist`);
          if (["options", "rules", "lexer"].includes(i))
            continue;
          const o = i, a = n.tokenizer[o], l = r[o];
          r[o] = (...h) => {
            let c = a.apply(r, h);
            return c === !1 && (c = l.apply(r, h)), c;
          };
        }
        s.tokenizer = r;
      }
      if (n.hooks) {
        const r = this.defaults.hooks || new pr();
        for (const i in n.hooks) {
          if (!(i in r))
            throw new Error(`hook '${i}' does not exist`);
          if (["options", "block"].includes(i))
            continue;
          const o = i, a = n.hooks[o], l = r[o];
          pr.passThroughHooks.has(i) ? r[o] = (h) => {
            if (this.defaults.async)
              return Promise.resolve(a.call(r, h)).then((b) => l.call(r, b));
            const c = a.call(r, h);
            return l.call(r, c);
          } : r[o] = (...h) => {
            let c = a.apply(r, h);
            return c === !1 && (c = l.apply(r, h)), c;
          };
        }
        s.hooks = r;
      }
      if (n.walkTokens) {
        const r = this.defaults.walkTokens, i = n.walkTokens;
        s.walkTokens = function(o) {
          let a = [];
          return a.push(i.call(this, o)), r && (a = a.concat(r.call(this, o))), a;
        };
      }
      this.defaults = { ...this.defaults, ...s };
    }), this;
  }
  setOptions(t) {
    return this.defaults = { ...this.defaults, ...t }, this;
  }
  lexer(t, e) {
    return gn.lex(t, e ?? this.defaults);
  }
  parser(t, e) {
    return mn.parse(t, e ?? this.defaults);
  }
  parseMarkdown(t) {
    return (n, s) => {
      const r = { ...s }, i = { ...this.defaults, ...r }, o = this.onError(!!i.silent, !!i.async);
      if (this.defaults.async === !0 && r.async === !1)
        return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null)
        return o(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string")
        return o(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      i.hooks && (i.hooks.options = i, i.hooks.block = t);
      const a = i.hooks ? i.hooks.provideLexer() : t ? gn.lex : gn.lexInline, l = i.hooks ? i.hooks.provideParser() : t ? mn.parse : mn.parseInline;
      if (i.async)
        return Promise.resolve(i.hooks ? i.hooks.preprocess(n) : n).then((h) => a(h, i)).then((h) => i.hooks ? i.hooks.processAllTokens(h) : h).then((h) => i.walkTokens ? Promise.all(this.walkTokens(h, i.walkTokens)).then(() => h) : h).then((h) => l(h, i)).then((h) => i.hooks ? i.hooks.postprocess(h) : h).catch(o);
      try {
        i.hooks && (n = i.hooks.preprocess(n));
        let h = a(n, i);
        i.hooks && (h = i.hooks.processAllTokens(h)), i.walkTokens && this.walkTokens(h, i.walkTokens);
        let c = l(h, i);
        return i.hooks && (c = i.hooks.postprocess(c)), c;
      } catch (h) {
        return o(h);
      }
    };
  }
  onError(t, e) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, t) {
        const s = "<p>An error occurred:</p><pre>" + Jt(n.message + "", !0) + "</pre>";
        return e ? Promise.resolve(s) : s;
      }
      if (e)
        return Promise.reject(n);
      throw n;
    };
  }
}, zn = new od();
function Ne(t, e) {
  return zn.parse(t, e);
}
Ne.options = Ne.setOptions = function(t) {
  return zn.setOptions(t), Ne.defaults = zn.defaults, Yl(Ne.defaults), Ne;
};
Ne.getDefaults = ao;
Ne.defaults = Hn;
Ne.use = function(...t) {
  return zn.use(...t), Ne.defaults = zn.defaults, Yl(Ne.defaults), Ne;
};
Ne.walkTokens = function(t, e) {
  return zn.walkTokens(t, e);
};
Ne.parseInline = zn.parseInline;
Ne.Parser = mn;
Ne.parser = mn.parse;
Ne.Renderer = Ir;
Ne.TextRenderer = mo;
Ne.Lexer = gn;
Ne.lexer = gn.lex;
Ne.Tokenizer = Rr;
Ne.Hooks = pr;
Ne.parse = Ne;
Ne.options;
Ne.setOptions;
Ne.use;
Ne.walkTokens;
Ne.parseInline;
mn.parse;
gn.lex;
/*! @license DOMPurify 3.2.6 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.2.6/LICENSE */
const {
  entries: oc,
  setPrototypeOf: Sa,
  isFrozen: ad,
  getPrototypeOf: ld,
  getOwnPropertyDescriptor: cd
} = Object;
let {
  freeze: It,
  seal: Ht,
  create: ac
} = Object, {
  apply: Mi,
  construct: Di
} = typeof Reflect < "u" && Reflect;
It || (It = function(e) {
  return e;
});
Ht || (Ht = function(e) {
  return e;
});
Mi || (Mi = function(e, n, s) {
  return e.apply(n, s);
});
Di || (Di = function(e, n) {
  return new e(...n);
});
const ir = Lt(Array.prototype.forEach), ud = Lt(Array.prototype.lastIndexOf), Ea = Lt(Array.prototype.pop), ws = Lt(Array.prototype.push), fd = Lt(Array.prototype.splice), gr = Lt(String.prototype.toLowerCase), ui = Lt(String.prototype.toString), Ca = Lt(String.prototype.match), ks = Lt(String.prototype.replace), hd = Lt(String.prototype.indexOf), dd = Lt(String.prototype.trim), Kt = Lt(Object.prototype.hasOwnProperty), Tt = Lt(RegExp.prototype.test), xs = pd(TypeError);
function Lt(t) {
  return function(e) {
    e instanceof RegExp && (e.lastIndex = 0);
    for (var n = arguments.length, s = new Array(n > 1 ? n - 1 : 0), r = 1; r < n; r++)
      s[r - 1] = arguments[r];
    return Mi(t, e, s);
  };
}
function pd(t) {
  return function() {
    for (var e = arguments.length, n = new Array(e), s = 0; s < e; s++)
      n[s] = arguments[s];
    return Di(t, n);
  };
}
function Ee(t, e) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : gr;
  Sa && Sa(t, null);
  let s = e.length;
  for (; s--; ) {
    let r = e[s];
    if (typeof r == "string") {
      const i = n(r);
      i !== r && (ad(e) || (e[s] = i), r = i);
    }
    t[r] = !0;
  }
  return t;
}
function gd(t) {
  for (let e = 0; e < t.length; e++)
    Kt(t, e) || (t[e] = null);
  return t;
}
function un(t) {
  const e = ac(null);
  for (const [n, s] of oc(t))
    Kt(t, n) && (Array.isArray(s) ? e[n] = gd(s) : s && typeof s == "object" && s.constructor === Object ? e[n] = un(s) : e[n] = s);
  return e;
}
function As(t, e) {
  for (; t !== null; ) {
    const s = cd(t, e);
    if (s) {
      if (s.get)
        return Lt(s.get);
      if (typeof s.value == "function")
        return Lt(s.value);
    }
    t = ld(t);
  }
  function n() {
    return null;
  }
  return n;
}
const Ra = It(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "section", "select", "shadow", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]), fi = It(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]), hi = It(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]), md = It(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]), di = It(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]), _d = It(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]), Ia = It(["#text"]), La = It(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns", "slot"]), pi = It(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]), Oa = It(["accent", "accentunder", "align", "bevelled", "close", "columnsalign", "columnlines", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lspace", "lquote", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]), or = It(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]), yd = Ht(/\{\{[\w\W]*|[\w\W]*\}\}/gm), vd = Ht(/<%[\w\W]*|[\w\W]*%>/gm), bd = Ht(/\$\{[\w\W]*/gm), wd = Ht(/^data-[\-\w.\u00B7-\uFFFF]+$/), kd = Ht(/^aria-[\-\w]+$/), lc = Ht(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
), xd = Ht(/^(?:\w+script|data):/i), Ad = Ht(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
), cc = Ht(/^html$/i), Td = Ht(/^[a-z][.\w]*(-[.\w]+)+$/i);
var Pa = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ARIA_ATTR: kd,
  ATTR_WHITESPACE: Ad,
  CUSTOM_ELEMENT: Td,
  DATA_ATTR: wd,
  DOCTYPE_NAME: cc,
  ERB_EXPR: vd,
  IS_ALLOWED_URI: lc,
  IS_SCRIPT_OR_DATA: xd,
  MUSTACHE_EXPR: yd,
  TMPLIT_EXPR: bd
});
const Ts = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9
}, Sd = function() {
  return typeof window > "u" ? null : window;
}, Ed = function(e, n) {
  if (typeof e != "object" || typeof e.createPolicy != "function")
    return null;
  let s = null;
  const r = "data-tt-policy-suffix";
  n && n.hasAttribute(r) && (s = n.getAttribute(r));
  const i = "dompurify" + (s ? "#" + s : "");
  try {
    return e.createPolicy(i, {
      createHTML(o) {
        return o;
      },
      createScriptURL(o) {
        return o;
      }
    });
  } catch {
    return console.warn("TrustedTypes policy " + i + " could not be created."), null;
  }
}, Na = function() {
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
function uc() {
  let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : Sd();
  const e = (Z) => uc(Z);
  if (e.version = "3.2.6", e.removed = [], !t || !t.document || t.document.nodeType !== Ts.document || !t.Element)
    return e.isSupported = !1, e;
  let {
    document: n
  } = t;
  const s = n, r = s.currentScript, {
    DocumentFragment: i,
    HTMLTemplateElement: o,
    Node: a,
    Element: l,
    NodeFilter: h,
    NamedNodeMap: c = t.NamedNodeMap || t.MozNamedAttrMap,
    HTMLFormElement: b,
    DOMParser: m,
    trustedTypes: P
  } = t, $ = l.prototype, j = As($, "cloneNode"), Le = As($, "remove"), te = As($, "nextSibling"), Re = As($, "childNodes"), xe = As($, "parentNode");
  if (typeof o == "function") {
    const Z = n.createElement("template");
    Z.content && Z.content.ownerDocument && (n = Z.content.ownerDocument);
  }
  let z, W = "";
  const {
    implementation: ne,
    createNodeIterator: V,
    createDocumentFragment: Fe,
    getElementsByTagName: it
  } = n, {
    importNode: Ve
  } = s;
  let Te = Na();
  e.isSupported = typeof oc == "function" && typeof xe == "function" && ne && ne.createHTMLDocument !== void 0;
  const {
    MUSTACHE_EXPR: me,
    ERB_EXPR: Ke,
    TMPLIT_EXPR: Je,
    DATA_ATTR: ct,
    ARIA_ATTR: ae,
    IS_SCRIPT_OR_DATA: _e,
    ATTR_WHITESPACE: le,
    CUSTOM_ELEMENT: ft
  } = Pa;
  let {
    IS_ALLOWED_URI: ot
  } = Pa, ie = null;
  const nt = Ee({}, [...Ra, ...fi, ...hi, ...di, ...Ia]);
  let ve = null;
  const q = Ee({}, [...La, ...pi, ...Oa, ...or]);
  let de = Object.seal(ac(null, {
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
  })), se = null, Ie = null, K = !0, Qe = !0, ut = !1, vt = !0, p = !1, y = !0, k = !1, O = !1, R = !1, L = !1, B = !1, D = !1, M = !0, N = !1;
  const X = "user-content-";
  let U = !0, G = !1, Q = {}, ue = null;
  const Oe = Ee({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let pe = null;
  const De = Ee({}, ["audio", "video", "img", "source", "image", "track"]);
  let Be = null;
  const qe = Ee({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]), f = "http://www.w3.org/1998/Math/MathML", v = "http://www.w3.org/2000/svg", A = "http://www.w3.org/1999/xhtml";
  let x = A, F = !1, Y = null;
  const ee = Ee({}, [f, v, A], ui);
  let be = Ee({}, ["mi", "mo", "mn", "ms", "mtext"]), Se = Ee({}, ["annotation-xml"]);
  const Ge = Ee({}, ["title", "style", "font", "a", "script"]);
  let Me = null;
  const dt = ["application/xhtml+xml", "text/html"], bt = "text/html";
  let We = null, Xt = null;
  const is = n.createElement("form"), Pn = function(_) {
    return _ instanceof RegExp || _ instanceof Function;
  }, qn = function() {
    let _ = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (!(Xt && Xt === _)) {
      if ((!_ || typeof _ != "object") && (_ = {}), _ = un(_), Me = // eslint-disable-next-line unicorn/prefer-includes
      dt.indexOf(_.PARSER_MEDIA_TYPE) === -1 ? bt : _.PARSER_MEDIA_TYPE, We = Me === "application/xhtml+xml" ? ui : gr, ie = Kt(_, "ALLOWED_TAGS") ? Ee({}, _.ALLOWED_TAGS, We) : nt, ve = Kt(_, "ALLOWED_ATTR") ? Ee({}, _.ALLOWED_ATTR, We) : q, Y = Kt(_, "ALLOWED_NAMESPACES") ? Ee({}, _.ALLOWED_NAMESPACES, ui) : ee, Be = Kt(_, "ADD_URI_SAFE_ATTR") ? Ee(un(qe), _.ADD_URI_SAFE_ATTR, We) : qe, pe = Kt(_, "ADD_DATA_URI_TAGS") ? Ee(un(De), _.ADD_DATA_URI_TAGS, We) : De, ue = Kt(_, "FORBID_CONTENTS") ? Ee({}, _.FORBID_CONTENTS, We) : Oe, se = Kt(_, "FORBID_TAGS") ? Ee({}, _.FORBID_TAGS, We) : un({}), Ie = Kt(_, "FORBID_ATTR") ? Ee({}, _.FORBID_ATTR, We) : un({}), Q = Kt(_, "USE_PROFILES") ? _.USE_PROFILES : !1, K = _.ALLOW_ARIA_ATTR !== !1, Qe = _.ALLOW_DATA_ATTR !== !1, ut = _.ALLOW_UNKNOWN_PROTOCOLS || !1, vt = _.ALLOW_SELF_CLOSE_IN_ATTR !== !1, p = _.SAFE_FOR_TEMPLATES || !1, y = _.SAFE_FOR_XML !== !1, k = _.WHOLE_DOCUMENT || !1, L = _.RETURN_DOM || !1, B = _.RETURN_DOM_FRAGMENT || !1, D = _.RETURN_TRUSTED_TYPE || !1, R = _.FORCE_BODY || !1, M = _.SANITIZE_DOM !== !1, N = _.SANITIZE_NAMED_PROPS || !1, U = _.KEEP_CONTENT !== !1, G = _.IN_PLACE || !1, ot = _.ALLOWED_URI_REGEXP || lc, x = _.NAMESPACE || A, be = _.MATHML_TEXT_INTEGRATION_POINTS || be, Se = _.HTML_INTEGRATION_POINTS || Se, de = _.CUSTOM_ELEMENT_HANDLING || {}, _.CUSTOM_ELEMENT_HANDLING && Pn(_.CUSTOM_ELEMENT_HANDLING.tagNameCheck) && (de.tagNameCheck = _.CUSTOM_ELEMENT_HANDLING.tagNameCheck), _.CUSTOM_ELEMENT_HANDLING && Pn(_.CUSTOM_ELEMENT_HANDLING.attributeNameCheck) && (de.attributeNameCheck = _.CUSTOM_ELEMENT_HANDLING.attributeNameCheck), _.CUSTOM_ELEMENT_HANDLING && typeof _.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements == "boolean" && (de.allowCustomizedBuiltInElements = _.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements), p && (Qe = !1), B && (L = !0), Q && (ie = Ee({}, Ia), ve = [], Q.html === !0 && (Ee(ie, Ra), Ee(ve, La)), Q.svg === !0 && (Ee(ie, fi), Ee(ve, pi), Ee(ve, or)), Q.svgFilters === !0 && (Ee(ie, hi), Ee(ve, pi), Ee(ve, or)), Q.mathMl === !0 && (Ee(ie, di), Ee(ve, Oa), Ee(ve, or))), _.ADD_TAGS && (ie === nt && (ie = un(ie)), Ee(ie, _.ADD_TAGS, We)), _.ADD_ATTR && (ve === q && (ve = un(ve)), Ee(ve, _.ADD_ATTR, We)), _.ADD_URI_SAFE_ATTR && Ee(Be, _.ADD_URI_SAFE_ATTR, We), _.FORBID_CONTENTS && (ue === Oe && (ue = un(ue)), Ee(ue, _.FORBID_CONTENTS, We)), U && (ie["#text"] = !0), k && Ee(ie, ["html", "head", "body"]), ie.table && (Ee(ie, ["tbody"]), delete se.tbody), _.TRUSTED_TYPES_POLICY) {
        if (typeof _.TRUSTED_TYPES_POLICY.createHTML != "function")
          throw xs('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
        if (typeof _.TRUSTED_TYPES_POLICY.createScriptURL != "function")
          throw xs('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
        z = _.TRUSTED_TYPES_POLICY, W = z.createHTML("");
      } else
        z === void 0 && (z = Ed(P, r)), z !== null && typeof W == "string" && (W = z.createHTML(""));
      It && It(_), Xt = _;
    }
  }, os = Ee({}, [...fi, ...hi, ...md]), qt = Ee({}, [...di, ..._d]), Ys = function(_) {
    let I = xe(_);
    (!I || !I.tagName) && (I = {
      namespaceURI: x,
      tagName: "template"
    });
    const H = gr(_.tagName), ge = gr(I.tagName);
    return Y[_.namespaceURI] ? _.namespaceURI === v ? I.namespaceURI === A ? H === "svg" : I.namespaceURI === f ? H === "svg" && (ge === "annotation-xml" || be[ge]) : !!os[H] : _.namespaceURI === f ? I.namespaceURI === A ? H === "math" : I.namespaceURI === v ? H === "math" && Se[ge] : !!qt[H] : _.namespaceURI === A ? I.namespaceURI === v && !Se[ge] || I.namespaceURI === f && !be[ge] ? !1 : !qt[H] && (Ge[H] || !os[H]) : !!(Me === "application/xhtml+xml" && Y[_.namespaceURI]) : !1;
  }, mt = function(_) {
    ws(e.removed, {
      element: _
    });
    try {
      xe(_).removeChild(_);
    } catch {
      Le(_);
    }
  }, bn = function(_, I) {
    try {
      ws(e.removed, {
        attribute: I.getAttributeNode(_),
        from: I
      });
    } catch {
      ws(e.removed, {
        attribute: null,
        from: I
      });
    }
    if (I.removeAttribute(_), _ === "is")
      if (L || B)
        try {
          mt(I);
        } catch {
        }
      else
        try {
          I.setAttribute(_, "");
        } catch {
        }
  }, Wn = function(_) {
    let I = null, H = null;
    if (R)
      _ = "<remove></remove>" + _;
    else {
      const st = Ca(_, /^[\r\n\t ]+/);
      H = st && st[0];
    }
    Me === "application/xhtml+xml" && x === A && (_ = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + _ + "</body></html>");
    const ge = z ? z.createHTML(_) : _;
    if (x === A)
      try {
        I = new m().parseFromString(ge, Me);
      } catch {
      }
    if (!I || !I.documentElement) {
      I = ne.createDocument(x, "template", null);
      try {
        I.documentElement.innerHTML = F ? W : ge;
      } catch {
      }
    }
    const at = I.body || I.documentElement;
    return _ && H && at.insertBefore(n.createTextNode(H), at.childNodes[0] || null), x === A ? it.call(I, k ? "html" : "body")[0] : k ? I.documentElement : at;
  }, as = function(_) {
    return V.call(
      _.ownerDocument || _,
      _,
      // eslint-disable-next-line no-bitwise
      h.SHOW_ELEMENT | h.SHOW_COMMENT | h.SHOW_TEXT | h.SHOW_PROCESSING_INSTRUCTION | h.SHOW_CDATA_SECTION,
      null
    );
  }, an = function(_) {
    return _ instanceof b && (typeof _.nodeName != "string" || typeof _.textContent != "string" || typeof _.removeChild != "function" || !(_.attributes instanceof c) || typeof _.removeAttribute != "function" || typeof _.setAttribute != "function" || typeof _.namespaceURI != "string" || typeof _.insertBefore != "function" || typeof _.hasChildNodes != "function");
  }, Xs = function(_) {
    return typeof a == "function" && _ instanceof a;
  };
  function Ot(Z, _, I) {
    ir(Z, (H) => {
      H.call(e, _, I, Xt);
    });
  }
  const ls = function(_) {
    let I = null;
    if (Ot(Te.beforeSanitizeElements, _, null), an(_))
      return mt(_), !0;
    const H = We(_.nodeName);
    if (Ot(Te.uponSanitizeElement, _, {
      tagName: H,
      allowedTags: ie
    }), y && _.hasChildNodes() && !Xs(_.firstElementChild) && Tt(/<[/\w!]/g, _.innerHTML) && Tt(/<[/\w!]/g, _.textContent) || _.nodeType === Ts.progressingInstruction || y && _.nodeType === Ts.comment && Tt(/<[/\w]/g, _.data))
      return mt(_), !0;
    if (!ie[H] || se[H]) {
      if (!se[H] && cs(H) && (de.tagNameCheck instanceof RegExp && Tt(de.tagNameCheck, H) || de.tagNameCheck instanceof Function && de.tagNameCheck(H)))
        return !1;
      if (U && !ue[H]) {
        const ge = xe(_) || _.parentNode, at = Re(_) || _.childNodes;
        if (at && ge) {
          const st = at.length;
          for (let _t = st - 1; _t >= 0; --_t) {
            const wt = j(at[_t], !0);
            wt.__removalCount = (_.__removalCount || 0) + 1, ge.insertBefore(wt, te(_));
          }
        }
      }
      return mt(_), !0;
    }
    return _ instanceof l && !Ys(_) || (H === "noscript" || H === "noembed" || H === "noframes") && Tt(/<\/no(script|embed|frames)/i, _.innerHTML) ? (mt(_), !0) : (p && _.nodeType === Ts.text && (I = _.textContent, ir([me, Ke, Je], (ge) => {
      I = ks(I, ge, " ");
    }), _.textContent !== I && (ws(e.removed, {
      element: _.cloneNode()
    }), _.textContent = I)), Ot(Te.afterSanitizeElements, _, null), !1);
  }, Zs = function(_, I, H) {
    if (M && (I === "id" || I === "name") && (H in n || H in is))
      return !1;
    if (!(Qe && !Ie[I] && Tt(ct, I))) {
      if (!(K && Tt(ae, I))) {
        if (!ve[I] || Ie[I]) {
          if (
            // First condition does a very basic check if a) it's basically a valid custom element tagname AND
            // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
            !(cs(_) && (de.tagNameCheck instanceof RegExp && Tt(de.tagNameCheck, _) || de.tagNameCheck instanceof Function && de.tagNameCheck(_)) && (de.attributeNameCheck instanceof RegExp && Tt(de.attributeNameCheck, I) || de.attributeNameCheck instanceof Function && de.attributeNameCheck(I)) || // Alternative, second condition checks if it's an `is`-attribute, AND
            // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            I === "is" && de.allowCustomizedBuiltInElements && (de.tagNameCheck instanceof RegExp && Tt(de.tagNameCheck, H) || de.tagNameCheck instanceof Function && de.tagNameCheck(H)))
          ) return !1;
        } else if (!Be[I]) {
          if (!Tt(ot, ks(H, le, ""))) {
            if (!((I === "src" || I === "xlink:href" || I === "href") && _ !== "script" && hd(H, "data:") === 0 && pe[_])) {
              if (!(ut && !Tt(_e, ks(H, le, "")))) {
                if (H)
                  return !1;
              }
            }
          }
        }
      }
    }
    return !0;
  }, cs = function(_) {
    return _ !== "annotation-xml" && Ca(_, ft);
  }, Nn = function(_) {
    Ot(Te.beforeSanitizeAttributes, _, null);
    const {
      attributes: I
    } = _;
    if (!I || an(_))
      return;
    const H = {
      attrName: "",
      attrValue: "",
      keepAttr: !0,
      allowedAttributes: ve,
      forceKeepAttr: void 0
    };
    let ge = I.length;
    for (; ge--; ) {
      const at = I[ge], {
        name: st,
        namespaceURI: _t,
        value: wt
      } = at, ht = We(st), wn = wt;
      let rt = st === "value" ? wn : dd(wn);
      if (H.attrName = ht, H.attrValue = rt, H.keepAttr = !0, H.forceKeepAttr = void 0, Ot(Te.uponSanitizeAttribute, _, H), rt = H.attrValue, N && (ht === "id" || ht === "name") && (bn(st, _), rt = X + rt), y && Tt(/((--!?|])>)|<\/(style|title)/i, rt)) {
        bn(st, _);
        continue;
      }
      if (H.forceKeepAttr)
        continue;
      if (!H.keepAttr) {
        bn(st, _);
        continue;
      }
      if (!vt && Tt(/\/>/i, rt)) {
        bn(st, _);
        continue;
      }
      p && ir([me, Ke, Je], (Qs) => {
        rt = ks(rt, Qs, " ");
      });
      const Js = We(_.nodeName);
      if (!Zs(Js, ht, rt)) {
        bn(st, _);
        continue;
      }
      if (z && typeof P == "object" && typeof P.getAttributeType == "function" && !_t)
        switch (P.getAttributeType(Js, ht)) {
          case "TrustedHTML": {
            rt = z.createHTML(rt);
            break;
          }
          case "TrustedScriptURL": {
            rt = z.createScriptURL(rt);
            break;
          }
        }
      if (rt !== wn)
        try {
          _t ? _.setAttributeNS(_t, st, rt) : _.setAttribute(st, rt), an(_) ? mt(_) : Ea(e.removed);
        } catch {
          bn(st, _);
        }
    }
    Ot(Te.afterSanitizeAttributes, _, null);
  }, us = function Z(_) {
    let I = null;
    const H = as(_);
    for (Ot(Te.beforeSanitizeShadowDOM, _, null); I = H.nextNode(); )
      Ot(Te.uponSanitizeShadowNode, I, null), ls(I), Nn(I), I.content instanceof i && Z(I.content);
    Ot(Te.afterSanitizeShadowDOM, _, null);
  };
  return e.sanitize = function(Z) {
    let _ = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, I = null, H = null, ge = null, at = null;
    if (F = !Z, F && (Z = "<!-->"), typeof Z != "string" && !Xs(Z))
      if (typeof Z.toString == "function") {
        if (Z = Z.toString(), typeof Z != "string")
          throw xs("dirty is not a string, aborting");
      } else
        throw xs("toString is not a function");
    if (!e.isSupported)
      return Z;
    if (O || qn(_), e.removed = [], typeof Z == "string" && (G = !1), G) {
      if (Z.nodeName) {
        const wt = We(Z.nodeName);
        if (!ie[wt] || se[wt])
          throw xs("root node is forbidden and cannot be sanitized in-place");
      }
    } else if (Z instanceof a)
      I = Wn("<!---->"), H = I.ownerDocument.importNode(Z, !0), H.nodeType === Ts.element && H.nodeName === "BODY" || H.nodeName === "HTML" ? I = H : I.appendChild(H);
    else {
      if (!L && !p && !k && // eslint-disable-next-line unicorn/prefer-includes
      Z.indexOf("<") === -1)
        return z && D ? z.createHTML(Z) : Z;
      if (I = Wn(Z), !I)
        return L ? null : D ? W : "";
    }
    I && R && mt(I.firstChild);
    const st = as(G ? Z : I);
    for (; ge = st.nextNode(); )
      ls(ge), Nn(ge), ge.content instanceof i && us(ge.content);
    if (G)
      return Z;
    if (L) {
      if (B)
        for (at = Fe.call(I.ownerDocument); I.firstChild; )
          at.appendChild(I.firstChild);
      else
        at = I;
      return (ve.shadowroot || ve.shadowrootmode) && (at = Ve.call(s, at, !0)), at;
    }
    let _t = k ? I.outerHTML : I.innerHTML;
    return k && ie["!doctype"] && I.ownerDocument && I.ownerDocument.doctype && I.ownerDocument.doctype.name && Tt(cc, I.ownerDocument.doctype.name) && (_t = "<!DOCTYPE " + I.ownerDocument.doctype.name + `>
` + _t), p && ir([me, Ke, Je], (wt) => {
      _t = ks(_t, wt, " ");
    }), z && D ? z.createHTML(_t) : _t;
  }, e.setConfig = function() {
    let Z = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    qn(Z), O = !0;
  }, e.clearConfig = function() {
    Xt = null, O = !1;
  }, e.isValidAttribute = function(Z, _, I) {
    Xt || qn({});
    const H = We(Z), ge = We(_);
    return Zs(H, ge, I);
  }, e.addHook = function(Z, _) {
    typeof _ == "function" && ws(Te[Z], _);
  }, e.removeHook = function(Z, _) {
    if (_ !== void 0) {
      const I = ud(Te[Z], _);
      return I === -1 ? void 0 : fd(Te[Z], I, 1)[0];
    }
    return Ea(Te[Z]);
  }, e.removeHooks = function(Z) {
    Te[Z] = [];
  }, e.removeAllHooks = function() {
    Te = Na();
  }, e;
}
var _o = uc();
_o.addHook("uponSanitizeElement", (t, e) => {
  var r, i, o, a, l;
  if (e.tagName === "svg") {
    (r = t.parentNode) == null || r.removeChild(t);
    return;
  }
  if (e.tagName === "math") {
    (i = t.parentNode) == null || i.removeChild(t);
    return;
  }
  if (e.tagName === "foreignobject") {
    (o = t.parentNode) == null || o.removeChild(t);
    return;
  }
  const n = t, s = (a = e.tagName) == null ? void 0 : a.toUpperCase();
  (s === "IMG" || s === "AREA" || s === "MAP") && ((l = n.parentNode) == null || l.removeChild(n));
});
_o.addHook("afterSanitizeAttributes", (t) => {
  if (t.hasAttribute("href")) {
    const e = t.getAttribute("href") || "";
    try {
      const n = decodeURIComponent(e.toLowerCase());
      (n.includes("javascript:") || n.includes("data:text/html") || n.includes("vbscript:") || n.includes("about:") || n.includes("file:")) && t.removeAttribute("href");
    } catch {
      (e.toLowerCase().includes("javascript:") || e.toLowerCase().includes("data:text/html") || e.toLowerCase().includes("vbscript:") || e.toLowerCase().includes("about:") || e.toLowerCase().includes("file:")) && t.removeAttribute("href");
    }
  }
  if (t.nodeName === "A") {
    const e = (t.getAttribute("href") || "").trim();
    /^(https?:|mailto:)/i.test(e) ? (t.setAttribute("target", "_blank"), t.setAttribute("rel", "noopener noreferrer nofollow")) : t.removeAttribute("href");
  }
  if (t.hasAttribute("src")) {
    const e = t.getAttribute("src") || "";
    try {
      const n = decodeURIComponent(e.toLowerCase());
      (n.includes("javascript:") || n.includes("data:text/html") || n.includes("vbscript:") || n.includes("about:") || n.includes("file:")) && t.removeAttribute("src");
    } catch {
      (e.toLowerCase().includes("javascript:") || e.toLowerCase().includes("data:text/html") || e.toLowerCase().includes("vbscript:") || e.toLowerCase().includes("about:") || e.toLowerCase().includes("file:")) && t.removeAttribute("src");
    }
  }
  if (t.hasAttribute("style")) {
    const e = t.getAttribute("style") || "";
    try {
      const n = decodeURIComponent(e.toLowerCase());
      (n.includes("expression(") || n.includes("behavior:") || n.includes("-moz-binding") || n.includes("import") || n.includes("javascript:") || n.includes("vbscript:")) && t.removeAttribute("style");
    } catch {
      (e.toLowerCase().includes("expression(") || e.toLowerCase().includes("behavior:") || e.toLowerCase().includes("-moz-binding") || e.toLowerCase().includes("import") || e.toLowerCase().includes("javascript:") || e.toLowerCase().includes("vbscript:")) && t.removeAttribute("style");
    }
  }
  Array.from(t.attributes).forEach((e) => {
    e.name.toLowerCase().startsWith("on") && t.removeAttribute(e.name);
  });
});
function Cd(t) {
  const e = {
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
  return _o.sanitize(t, e);
}
const Rs = [
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
], Rd = (t) => (t || "").split("").reduce((e, n) => e + n.charCodeAt(0), 0) % Rs.length, Id = (t) => {
  const e = Rs[(t % Rs.length + Rs.length) % Rs.length];
  return {
    background: `
            radial-gradient(circle at 32% 28%, rgba(255,255,255,0.22) 0%, transparent 42%),
            radial-gradient(circle at 68% 72%, rgba(0,0,0,0.25) 0%, transparent 38%),
            radial-gradient(ellipse at 50% 50%, ${e.stops})
        `.trim(),
    boxShadow: `0 4px 28px ${e.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
    borderRadius: "50%"
  };
}, Ld = (t, e) => {
  const n = typeof e == "number" && Number.isFinite(e) ? e : Rd(t);
  return Id(n);
}, Fa = (t) => {
  var e;
  return !!((e = t == null ? void 0 : t.attributes) != null && e.end_chat);
}, Od = "AI can make mistakes. Check important info.";
function Pd(t, e = !1) {
  return t !== !1 && !e;
}
const fc = (t) => !!t && (/^https?:\/\//i.test(t) || t.startsWith("data:")), Nd = (t, e) => t ? fc(t) || t.startsWith("blob:") ? t : `${e.replace(/\/api\/v1\/?$/, "")}${t.startsWith("/") ? "" : "/"}${t}` : "";
function Ma() {
  return typeof window < "u" && window.APP_CONFIG ? window.APP_CONFIG : {};
}
const Ws = {
  get API_URL() {
    return Ma().API_URL || "https://api.chattermate.chat/api/v1";
  },
  get WS_URL() {
    return Ma().WS_URL || "wss://api.chattermate.chat";
  }
};
function Lr(t) {
  return Nd(t, Ws.API_URL);
}
function Fd(t) {
  const e = Ce(() => ({
    backgroundColor: "var(--cm-card)",
    color: "var(--cm-text)"
  })), n = Ce(() => ({
    backgroundColor: t.value.chat_bubble_color || "#C9F24E",
    color: ns(t.value.chat_bubble_color || "#C9F24E") ? "#FFFFFF" : "#000000"
  })), s = Ce(() => ({
    backgroundColor: "var(--cm-agent-bg)",
    color: "var(--cm-text)"
  })), r = Ce(() => ({
    backgroundColor: "var(--cm-accent)",
    color: "var(--cm-on-accent)"
  })), i = Ce(() => ({
    color: "var(--cm-text)"
  })), o = Ce(() => ({
    borderBottom: "1px solid var(--cm-hairline)"
  })), a = Ce(() => Lr(t.value.photo_url)), l = Ce(() => {
    const h = t.value.chat_background_color || "#ffffff";
    return {
      boxShadow: `0 8px 5px ${ns(h) ? "rgba(0, 0, 0, 0.24)" : "rgba(0, 0, 0, 0.12)"}`
    };
  });
  return {
    chatStyles: e,
    chatIconStyles: n,
    agentBubbleStyles: s,
    userBubbleStyles: r,
    messageNameStyles: i,
    headerBorderStyles: o,
    photoUrl: a,
    shadowStyle: l
  };
}
const Md = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]), Dd = /* @__PURE__ */ new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);
[...Md, ...Dd];
function Bd(t, e) {
  const n = ce([]), s = ce(!1), r = ce(null), i = (W) => {
    if (W === 0) return "0 Bytes";
    const ne = 1024, V = ["Bytes", "KB", "MB", "GB"], Fe = Math.floor(Math.log(W) / Math.log(ne));
    return parseFloat((W / Math.pow(ne, Fe)).toFixed(2)) + " " + V[Fe];
  }, o = (W) => W.startsWith("image/"), a = (W) => W ? Lr(W) : "", l = (W) => {
    const ne = W.file_url || W.url;
    return ne ? Lr(ne) : "";
  }, h = async (W) => {
    const ne = W.target;
    ne.files && ne.files.length > 0 && (await j(Array.from(ne.files)), ne.value = "");
  }, c = async (W) => {
    var V;
    W.preventDefault();
    const ne = (V = W.dataTransfer) == null ? void 0 : V.files;
    ne && ne.length > 0 && await j(Array.from(ne));
  }, b = (W) => {
    W.preventDefault();
  }, m = (W) => {
    W.preventDefault();
  }, P = async (W) => {
    var Fe;
    const ne = (Fe = W.clipboardData) == null ? void 0 : Fe.items;
    if (!ne) return;
    const V = [];
    for (const it of Array.from(ne))
      if (it.kind === "file") {
        const Ve = it.getAsFile();
        Ve && V.push(Ve);
      }
    V.length > 0 && await j(V);
  }, $ = async (W, ne = 500) => new Promise((V, Fe) => {
    const it = new FileReader();
    it.onload = (Ve) => {
      var me;
      const Te = new Image();
      Te.onload = () => {
        const Ke = document.createElement("canvas");
        let Je = Te.width, ct = Te.height;
        const ae = 1920;
        (Je > ae || ct > ae) && (Je > ct ? (ct = ct / Je * ae, Je = ae) : (Je = Je / ct * ae, ct = ae)), Ke.width = Je, Ke.height = ct;
        const _e = Ke.getContext("2d");
        if (!_e) {
          Fe(new Error("Failed to get canvas context"));
          return;
        }
        _e.drawImage(Te, 0, 0, Je, ct);
        let le = 0.9;
        const ft = () => {
          Ke.toBlob((ot) => {
            if (!ot) {
              Fe(new Error("Failed to compress image"));
              return;
            }
            if (ot.size / 1024 > ne && le > 0.3)
              le -= 0.1, ft();
            else {
              const nt = new FileReader();
              nt.onload = () => {
                const ve = nt.result.split(",")[1];
                V({ blob: ot, base64: ve });
              }, nt.readAsDataURL(ot);
            }
          }, W.type === "image/png" ? "image/png" : "image/jpeg", le);
        };
        ft();
      }, Te.onerror = () => Fe(new Error("Failed to load image")), Te.src = (me = Ve.target) == null ? void 0 : me.result;
    }, it.onerror = () => Fe(new Error("Failed to read file")), it.readAsDataURL(W);
  }), j = async (W) => {
    if (n.value.length >= 3) {
      alert("Maximum 3 files allowed per message");
      return;
    }
    const Ve = 3 - n.value.length, Te = W.slice(0, Ve);
    W.length > Ve && alert(`Only ${Ve} more file(s) can be uploaded. Maximum 3 files per message.`);
    for (const me of Te)
      try {
        if (n.value.some((ae) => ae.filename === me.name)) {
          console.warn(`File ${me.name} is already selected`), alert(`File "${me.name}" is already selected`);
          continue;
        }
        const Je = me.type.startsWith("image/"), ct = Je ? 5242880 : 10485760;
        if (me.size > ct) {
          const ae = ct / 1048576;
          console.error(`File ${me.name} is too large. Maximum size is ${ae}MB`), alert(`File "${me.name}" is too large. Maximum size for ${Je ? "images" : "documents"} is ${ae}MB`);
          continue;
        }
        if (Je)
          try {
            const { blob: ae, base64: _e } = await $(me, 500), le = ae.size;
            console.log(`Compressed ${me.name}: ${(me.size / 1024).toFixed(2)}KB → ${(le / 1024).toFixed(2)}KB`), n.value.push({
              content: _e,
              filename: me.name,
              type: me.type,
              size: le,
              url: URL.createObjectURL(ae),
              file_url: URL.createObjectURL(ae)
            });
          } catch (ae) {
            console.error("Image compression failed, uploading original:", ae);
            const _e = new FileReader();
            _e.onload = (le) => {
              var ie;
              const ot = ((ie = le.target) == null ? void 0 : ie.result).split(",")[1];
              n.value.push({
                content: ot,
                filename: me.name,
                type: me.type,
                size: me.size,
                url: URL.createObjectURL(me),
                file_url: URL.createObjectURL(me)
              });
            }, _e.readAsDataURL(me);
          }
        else {
          const ae = new FileReader();
          ae.onload = (_e) => {
            var ot;
            const ft = ((ot = _e.target) == null ? void 0 : ot.result).split(",")[1];
            n.value.push({
              content: ft,
              filename: me.name,
              type: me.type || "application/octet-stream",
              size: me.size,
              url: "",
              file_url: ""
            });
          }, ae.readAsDataURL(me);
        }
      } catch (Ke) {
        console.error("File upload error:", Ke);
      }
  };
  return {
    uploadedAttachments: n,
    previewModal: s,
    previewFile: r,
    formatFileSize: i,
    isImageAttachment: o,
    getDownloadUrl: a,
    getPreviewUrl: l,
    handleFileSelect: h,
    handleDrop: c,
    handleDragOver: b,
    handleDragLeave: m,
    handlePaste: P,
    uploadFiles: j,
    removeAttachment: async (W) => {
      const ne = n.value[W];
      if (ne) {
        try {
          let V = ne.url;
          if (V.startsWith("/uploads/") ? V = V.substring(9) : V.startsWith("/") && (V = V.substring(1)), fc(V))
            try {
              V = new URL(V).pathname.replace(/^\/+/, "");
            } catch {
            }
          const Fe = {};
          t.value && (Fe.Authorization = `Bearer ${t.value}`);
          const it = await fetch(`${Ws.API_URL}/files/upload/${V}`, {
            method: "DELETE",
            headers: Fe
          });
          if (it.ok)
            console.log("File deleted successfully from backend.");
          else {
            const Ve = await it.json();
            console.error("Failed to delete file:", Ve.detail);
          }
        } catch (V) {
          console.error("Error calling delete API:", V);
        }
        ne.url && ne.url.startsWith("blob:") && URL.revokeObjectURL(ne.url), ne.file_url && ne.file_url.startsWith("blob:") && URL.revokeObjectURL(ne.file_url), n.value.splice(W, 1);
      }
    },
    openPreview: (W) => {
      r.value = W, s.value = !0;
    },
    closePreview: () => {
      s.value = !1, setTimeout(() => {
        r.value = null;
      }, 300);
    },
    openFilePicker: () => {
      var W;
      (W = e.value) == null || W.click();
    },
    isImage: (W) => W.startsWith("image/")
  };
}
const on = /* @__PURE__ */ Object.create(null);
on.open = "0";
on.close = "1";
on.ping = "2";
on.pong = "3";
on.message = "4";
on.upgrade = "5";
on.noop = "6";
const mr = /* @__PURE__ */ Object.create(null);
Object.keys(on).forEach((t) => {
  mr[on[t]] = t;
});
const Bi = { type: "error", data: "parser error" }, hc = typeof Blob == "function" || typeof Blob < "u" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]", dc = typeof ArrayBuffer == "function", pc = (t) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(t) : t && t.buffer instanceof ArrayBuffer, yo = ({ type: t, data: e }, n, s) => hc && e instanceof Blob ? n ? s(e) : Da(e, s) : dc && (e instanceof ArrayBuffer || pc(e)) ? n ? s(e) : Da(new Blob([e]), s) : s(on[t] + (e || "")), Da = (t, e) => {
  const n = new FileReader();
  return n.onload = function() {
    const s = n.result.split(",")[1];
    e("b" + (s || ""));
  }, n.readAsDataURL(t);
};
function Ba(t) {
  return t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
}
let gi;
function $d(t, e) {
  if (hc && t.data instanceof Blob)
    return t.data.arrayBuffer().then(Ba).then(e);
  if (dc && (t.data instanceof ArrayBuffer || pc(t.data)))
    return e(Ba(t.data));
  yo(t, !1, (n) => {
    gi || (gi = new TextEncoder()), e(gi.encode(n));
  });
}
const $a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", Is = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (let t = 0; t < $a.length; t++)
  Is[$a.charCodeAt(t)] = t;
const Ud = (t) => {
  let e = t.length * 0.75, n = t.length, s, r = 0, i, o, a, l;
  t[t.length - 1] === "=" && (e--, t[t.length - 2] === "=" && e--);
  const h = new ArrayBuffer(e), c = new Uint8Array(h);
  for (s = 0; s < n; s += 4)
    i = Is[t.charCodeAt(s)], o = Is[t.charCodeAt(s + 1)], a = Is[t.charCodeAt(s + 2)], l = Is[t.charCodeAt(s + 3)], c[r++] = i << 2 | o >> 4, c[r++] = (o & 15) << 4 | a >> 2, c[r++] = (a & 3) << 6 | l & 63;
  return h;
}, zd = typeof ArrayBuffer == "function", vo = (t, e) => {
  if (typeof t != "string")
    return {
      type: "message",
      data: gc(t, e)
    };
  const n = t.charAt(0);
  return n === "b" ? {
    type: "message",
    data: Hd(t.substring(1), e)
  } : mr[n] ? t.length > 1 ? {
    type: mr[n],
    data: t.substring(1)
  } : {
    type: mr[n]
  } : Bi;
}, Hd = (t, e) => {
  if (zd) {
    const n = Ud(t);
    return gc(n, e);
  } else
    return { base64: !0, data: t };
}, gc = (t, e) => {
  switch (e) {
    case "blob":
      return t instanceof Blob ? t : new Blob([t]);
    case "arraybuffer":
    default:
      return t instanceof ArrayBuffer ? t : t.buffer;
  }
}, mc = "", qd = (t, e) => {
  const n = t.length, s = new Array(n);
  let r = 0;
  t.forEach((i, o) => {
    yo(i, !1, (a) => {
      s[o] = a, ++r === n && e(s.join(mc));
    });
  });
}, Wd = (t, e) => {
  const n = t.split(mc), s = [];
  for (let r = 0; r < n.length; r++) {
    const i = vo(n[r], e);
    if (s.push(i), i.type === "error")
      break;
  }
  return s;
};
function jd() {
  return new TransformStream({
    transform(t, e) {
      $d(t, (n) => {
        const s = n.length;
        let r;
        if (s < 126)
          r = new Uint8Array(1), new DataView(r.buffer).setUint8(0, s);
        else if (s < 65536) {
          r = new Uint8Array(3);
          const i = new DataView(r.buffer);
          i.setUint8(0, 126), i.setUint16(1, s);
        } else {
          r = new Uint8Array(9);
          const i = new DataView(r.buffer);
          i.setUint8(0, 127), i.setBigUint64(1, BigInt(s));
        }
        t.data && typeof t.data != "string" && (r[0] |= 128), e.enqueue(r), e.enqueue(n);
      });
    }
  });
}
let mi;
function ar(t) {
  return t.reduce((e, n) => e + n.length, 0);
}
function lr(t, e) {
  if (t[0].length === e)
    return t.shift();
  const n = new Uint8Array(e);
  let s = 0;
  for (let r = 0; r < e; r++)
    n[r] = t[0][s++], s === t[0].length && (t.shift(), s = 0);
  return t.length && s < t[0].length && (t[0] = t[0].slice(s)), n;
}
function Vd(t, e) {
  mi || (mi = new TextDecoder());
  const n = [];
  let s = 0, r = -1, i = !1;
  return new TransformStream({
    transform(o, a) {
      for (n.push(o); ; ) {
        if (s === 0) {
          if (ar(n) < 1)
            break;
          const l = lr(n, 1);
          i = (l[0] & 128) === 128, r = l[0] & 127, r < 126 ? s = 3 : r === 126 ? s = 1 : s = 2;
        } else if (s === 1) {
          if (ar(n) < 2)
            break;
          const l = lr(n, 2);
          r = new DataView(l.buffer, l.byteOffset, l.length).getUint16(0), s = 3;
        } else if (s === 2) {
          if (ar(n) < 8)
            break;
          const l = lr(n, 8), h = new DataView(l.buffer, l.byteOffset, l.length), c = h.getUint32(0);
          if (c > Math.pow(2, 21) - 1) {
            a.enqueue(Bi);
            break;
          }
          r = c * Math.pow(2, 32) + h.getUint32(4), s = 3;
        } else {
          if (ar(n) < r)
            break;
          const l = lr(n, r);
          a.enqueue(vo(i ? l : mi.decode(l), e)), s = 0;
        }
        if (r === 0 || r > t) {
          a.enqueue(Bi);
          break;
        }
      }
    }
  });
}
const _c = 4;
function pt(t) {
  if (t) return Kd(t);
}
function Kd(t) {
  for (var e in pt.prototype)
    t[e] = pt.prototype[e];
  return t;
}
pt.prototype.on = pt.prototype.addEventListener = function(t, e) {
  return this._callbacks = this._callbacks || {}, (this._callbacks["$" + t] = this._callbacks["$" + t] || []).push(e), this;
};
pt.prototype.once = function(t, e) {
  function n() {
    this.off(t, n), e.apply(this, arguments);
  }
  return n.fn = e, this.on(t, n), this;
};
pt.prototype.off = pt.prototype.removeListener = pt.prototype.removeAllListeners = pt.prototype.removeEventListener = function(t, e) {
  if (this._callbacks = this._callbacks || {}, arguments.length == 0)
    return this._callbacks = {}, this;
  var n = this._callbacks["$" + t];
  if (!n) return this;
  if (arguments.length == 1)
    return delete this._callbacks["$" + t], this;
  for (var s, r = 0; r < n.length; r++)
    if (s = n[r], s === e || s.fn === e) {
      n.splice(r, 1);
      break;
    }
  return n.length === 0 && delete this._callbacks["$" + t], this;
};
pt.prototype.emit = function(t) {
  this._callbacks = this._callbacks || {};
  for (var e = new Array(arguments.length - 1), n = this._callbacks["$" + t], s = 1; s < arguments.length; s++)
    e[s - 1] = arguments[s];
  if (n) {
    n = n.slice(0);
    for (var s = 0, r = n.length; s < r; ++s)
      n[s].apply(this, e);
  }
  return this;
};
pt.prototype.emitReserved = pt.prototype.emit;
pt.prototype.listeners = function(t) {
  return this._callbacks = this._callbacks || {}, this._callbacks["$" + t] || [];
};
pt.prototype.hasListeners = function(t) {
  return !!this.listeners(t).length;
};
const jr = typeof Promise == "function" && typeof Promise.resolve == "function" ? (e) => Promise.resolve().then(e) : (e, n) => n(e, 0), Bt = typeof self < "u" ? self : typeof window < "u" ? window : Function("return this")(), Gd = "arraybuffer";
function yc(t, ...e) {
  return e.reduce((n, s) => (t.hasOwnProperty(s) && (n[s] = t[s]), n), {});
}
const Yd = Bt.setTimeout, Xd = Bt.clearTimeout;
function Vr(t, e) {
  e.useNativeTimers ? (t.setTimeoutFn = Yd.bind(Bt), t.clearTimeoutFn = Xd.bind(Bt)) : (t.setTimeoutFn = Bt.setTimeout.bind(Bt), t.clearTimeoutFn = Bt.clearTimeout.bind(Bt));
}
const Zd = 1.33;
function Jd(t) {
  return typeof t == "string" ? Qd(t) : Math.ceil((t.byteLength || t.size) * Zd);
}
function Qd(t) {
  let e = 0, n = 0;
  for (let s = 0, r = t.length; s < r; s++)
    e = t.charCodeAt(s), e < 128 ? n += 1 : e < 2048 ? n += 2 : e < 55296 || e >= 57344 ? n += 3 : (s++, n += 4);
  return n;
}
function vc() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
function ep(t) {
  let e = "";
  for (let n in t)
    t.hasOwnProperty(n) && (e.length && (e += "&"), e += encodeURIComponent(n) + "=" + encodeURIComponent(t[n]));
  return e;
}
function tp(t) {
  let e = {}, n = t.split("&");
  for (let s = 0, r = n.length; s < r; s++) {
    let i = n[s].split("=");
    e[decodeURIComponent(i[0])] = decodeURIComponent(i[1]);
  }
  return e;
}
class np extends Error {
  constructor(e, n, s) {
    super(e), this.description = n, this.context = s, this.type = "TransportError";
  }
}
class bo extends pt {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} opts - options
   * @protected
   */
  constructor(e) {
    super(), this.writable = !1, Vr(this, e), this.opts = e, this.query = e.query, this.socket = e.socket, this.supportsBinary = !e.forceBase64;
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
  onError(e, n, s) {
    return super.emitReserved("error", new np(e, n, s)), this;
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
  send(e) {
    this.readyState === "open" && this.write(e);
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
  onData(e) {
    const n = vo(e, this.socket.binaryType);
    this.onPacket(n);
  }
  /**
   * Called with a decoded packet.
   *
   * @protected
   */
  onPacket(e) {
    super.emitReserved("packet", e);
  }
  /**
   * Called upon close.
   *
   * @protected
   */
  onClose(e) {
    this.readyState = "closed", super.emitReserved("close", e);
  }
  /**
   * Pauses the transport, in order not to lose packets during an upgrade.
   *
   * @param onPause
   */
  pause(e) {
  }
  createUri(e, n = {}) {
    return e + "://" + this._hostname() + this._port() + this.opts.path + this._query(n);
  }
  _hostname() {
    const e = this.opts.hostname;
    return e.indexOf(":") === -1 ? e : "[" + e + "]";
  }
  _port() {
    return this.opts.port && (this.opts.secure && +(this.opts.port !== 443) || !this.opts.secure && Number(this.opts.port) !== 80) ? ":" + this.opts.port : "";
  }
  _query(e) {
    const n = ep(e);
    return n.length ? "?" + n : "";
  }
}
class sp extends bo {
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
  pause(e) {
    this.readyState = "pausing";
    const n = () => {
      this.readyState = "paused", e();
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
  onData(e) {
    const n = (s) => {
      if (this.readyState === "opening" && s.type === "open" && this.onOpen(), s.type === "close")
        return this.onClose({ description: "transport closed by the server" }), !1;
      this.onPacket(s);
    };
    Wd(e, this.socket.binaryType).forEach(n), this.readyState !== "closed" && (this._polling = !1, this.emitReserved("pollComplete"), this.readyState === "open" && this._poll());
  }
  /**
   * For polling, send a close packet.
   *
   * @protected
   */
  doClose() {
    const e = () => {
      this.write([{ type: "close" }]);
    };
    this.readyState === "open" ? e() : this.once("open", e);
  }
  /**
   * Writes a packets payload.
   *
   * @param {Array} packets - data packets
   * @protected
   */
  write(e) {
    this.writable = !1, qd(e, (n) => {
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
    const e = this.opts.secure ? "https" : "http", n = this.query || {};
    return this.opts.timestampRequests !== !1 && (n[this.opts.timestampParam] = vc()), !this.supportsBinary && !n.sid && (n.b64 = 1), this.createUri(e, n);
  }
}
let bc = !1;
try {
  bc = typeof XMLHttpRequest < "u" && "withCredentials" in new XMLHttpRequest();
} catch {
}
const rp = bc;
function ip() {
}
class op extends sp {
  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @package
   */
  constructor(e) {
    if (super(e), typeof location < "u") {
      const n = location.protocol === "https:";
      let s = location.port;
      s || (s = n ? "443" : "80"), this.xd = typeof location < "u" && e.hostname !== location.hostname || s !== e.port;
    }
  }
  /**
   * Sends data.
   *
   * @param {String} data to send.
   * @param {Function} called upon flush.
   * @private
   */
  doWrite(e, n) {
    const s = this.request({
      method: "POST",
      data: e
    });
    s.on("success", n), s.on("error", (r, i) => {
      this.onError("xhr post error", r, i);
    });
  }
  /**
   * Starts a poll cycle.
   *
   * @private
   */
  doPoll() {
    const e = this.request();
    e.on("data", this.onData.bind(this)), e.on("error", (n, s) => {
      this.onError("xhr poll error", n, s);
    }), this.pollXhr = e;
  }
}
class sn extends pt {
  /**
   * Request constructor
   *
   * @param {Object} options
   * @package
   */
  constructor(e, n, s) {
    super(), this.createRequest = e, Vr(this, s), this._opts = s, this._method = s.method || "GET", this._uri = n, this._data = s.data !== void 0 ? s.data : null, this._create();
  }
  /**
   * Creates the XHR object and sends the request.
   *
   * @private
   */
  _create() {
    var e;
    const n = yc(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
    n.xdomain = !!this._opts.xd;
    const s = this._xhr = this.createRequest(n);
    try {
      s.open(this._method, this._uri, !0);
      try {
        if (this._opts.extraHeaders) {
          s.setDisableHeaderCheck && s.setDisableHeaderCheck(!0);
          for (let r in this._opts.extraHeaders)
            this._opts.extraHeaders.hasOwnProperty(r) && s.setRequestHeader(r, this._opts.extraHeaders[r]);
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
      (e = this._opts.cookieJar) === null || e === void 0 || e.addCookies(s), "withCredentials" in s && (s.withCredentials = this._opts.withCredentials), this._opts.requestTimeout && (s.timeout = this._opts.requestTimeout), s.onreadystatechange = () => {
        var r;
        s.readyState === 3 && ((r = this._opts.cookieJar) === null || r === void 0 || r.parseCookies(
          // @ts-ignore
          s.getResponseHeader("set-cookie")
        )), s.readyState === 4 && (s.status === 200 || s.status === 1223 ? this._onLoad() : this.setTimeoutFn(() => {
          this._onError(typeof s.status == "number" ? s.status : 0);
        }, 0));
      }, s.send(this._data);
    } catch (r) {
      this.setTimeoutFn(() => {
        this._onError(r);
      }, 0);
      return;
    }
    typeof document < "u" && (this._index = sn.requestsCount++, sn.requests[this._index] = this);
  }
  /**
   * Called upon error.
   *
   * @private
   */
  _onError(e) {
    this.emitReserved("error", e, this._xhr), this._cleanup(!0);
  }
  /**
   * Cleans up house.
   *
   * @private
   */
  _cleanup(e) {
    if (!(typeof this._xhr > "u" || this._xhr === null)) {
      if (this._xhr.onreadystatechange = ip, e)
        try {
          this._xhr.abort();
        } catch {
        }
      typeof document < "u" && delete sn.requests[this._index], this._xhr = null;
    }
  }
  /**
   * Called upon load.
   *
   * @private
   */
  _onLoad() {
    const e = this._xhr.responseText;
    e !== null && (this.emitReserved("data", e), this.emitReserved("success"), this._cleanup());
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
sn.requestsCount = 0;
sn.requests = {};
if (typeof document < "u") {
  if (typeof attachEvent == "function")
    attachEvent("onunload", Ua);
  else if (typeof addEventListener == "function") {
    const t = "onpagehide" in Bt ? "pagehide" : "unload";
    addEventListener(t, Ua, !1);
  }
}
function Ua() {
  for (let t in sn.requests)
    sn.requests.hasOwnProperty(t) && sn.requests[t].abort();
}
const ap = function() {
  const t = wc({
    xdomain: !1
  });
  return t && t.responseType !== null;
}();
class lp extends op {
  constructor(e) {
    super(e);
    const n = e && e.forceBase64;
    this.supportsBinary = ap && !n;
  }
  request(e = {}) {
    return Object.assign(e, { xd: this.xd }, this.opts), new sn(wc, this.uri(), e);
  }
}
function wc(t) {
  const e = t.xdomain;
  try {
    if (typeof XMLHttpRequest < "u" && (!e || rp))
      return new XMLHttpRequest();
  } catch {
  }
  if (!e)
    try {
      return new Bt[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch {
    }
}
const kc = typeof navigator < "u" && typeof navigator.product == "string" && navigator.product.toLowerCase() === "reactnative";
class cp extends bo {
  get name() {
    return "websocket";
  }
  doOpen() {
    const e = this.uri(), n = this.opts.protocols, s = kc ? {} : yc(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    this.opts.extraHeaders && (s.headers = this.opts.extraHeaders);
    try {
      this.ws = this.createSocket(e, n, s);
    } catch (r) {
      return this.emitReserved("error", r);
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
    }, this.ws.onclose = (e) => this.onClose({
      description: "websocket connection closed",
      context: e
    }), this.ws.onmessage = (e) => this.onData(e.data), this.ws.onerror = (e) => this.onError("websocket error", e);
  }
  write(e) {
    this.writable = !1;
    for (let n = 0; n < e.length; n++) {
      const s = e[n], r = n === e.length - 1;
      yo(s, this.supportsBinary, (i) => {
        try {
          this.doWrite(s, i);
        } catch {
        }
        r && jr(() => {
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
    const e = this.opts.secure ? "wss" : "ws", n = this.query || {};
    return this.opts.timestampRequests && (n[this.opts.timestampParam] = vc()), this.supportsBinary || (n.b64 = 1), this.createUri(e, n);
  }
}
const _i = Bt.WebSocket || Bt.MozWebSocket;
class up extends cp {
  createSocket(e, n, s) {
    return kc ? new _i(e, n, s) : n ? new _i(e, n) : new _i(e);
  }
  doWrite(e, n) {
    this.ws.send(n);
  }
}
class fp extends bo {
  get name() {
    return "webtransport";
  }
  doOpen() {
    try {
      this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
    } catch (e) {
      return this.emitReserved("error", e);
    }
    this._transport.closed.then(() => {
      this.onClose();
    }).catch((e) => {
      this.onError("webtransport error", e);
    }), this._transport.ready.then(() => {
      this._transport.createBidirectionalStream().then((e) => {
        const n = Vd(Number.MAX_SAFE_INTEGER, this.socket.binaryType), s = e.readable.pipeThrough(n).getReader(), r = jd();
        r.readable.pipeTo(e.writable), this._writer = r.writable.getWriter();
        const i = () => {
          s.read().then(({ done: a, value: l }) => {
            a || (this.onPacket(l), i());
          }).catch((a) => {
          });
        };
        i();
        const o = { type: "open" };
        this.query.sid && (o.data = `{"sid":"${this.query.sid}"}`), this._writer.write(o).then(() => this.onOpen());
      });
    });
  }
  write(e) {
    this.writable = !1;
    for (let n = 0; n < e.length; n++) {
      const s = e[n], r = n === e.length - 1;
      this._writer.write(s).then(() => {
        r && jr(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    var e;
    (e = this._transport) === null || e === void 0 || e.close();
  }
}
const hp = {
  websocket: up,
  webtransport: fp,
  polling: lp
}, dp = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, pp = [
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
function $i(t) {
  if (t.length > 8e3)
    throw "URI too long";
  const e = t, n = t.indexOf("["), s = t.indexOf("]");
  n != -1 && s != -1 && (t = t.substring(0, n) + t.substring(n, s).replace(/:/g, ";") + t.substring(s, t.length));
  let r = dp.exec(t || ""), i = {}, o = 14;
  for (; o--; )
    i[pp[o]] = r[o] || "";
  return n != -1 && s != -1 && (i.source = e, i.host = i.host.substring(1, i.host.length - 1).replace(/;/g, ":"), i.authority = i.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), i.ipv6uri = !0), i.pathNames = gp(i, i.path), i.queryKey = mp(i, i.query), i;
}
function gp(t, e) {
  const n = /\/{2,9}/g, s = e.replace(n, "/").split("/");
  return (e.slice(0, 1) == "/" || e.length === 0) && s.splice(0, 1), e.slice(-1) == "/" && s.splice(s.length - 1, 1), s;
}
function mp(t, e) {
  const n = {};
  return e.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(s, r, i) {
    r && (n[r] = i);
  }), n;
}
const Ui = typeof addEventListener == "function" && typeof removeEventListener == "function", _r = [];
Ui && addEventListener("offline", () => {
  _r.forEach((t) => t());
}, !1);
class En extends pt {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri - uri or options
   * @param {Object} opts - options
   */
  constructor(e, n) {
    if (super(), this.binaryType = Gd, this.writeBuffer = [], this._prevBufferLen = 0, this._pingInterval = -1, this._pingTimeout = -1, this._maxPayload = -1, this._pingTimeoutTime = 1 / 0, e && typeof e == "object" && (n = e, e = null), e) {
      const s = $i(e);
      n.hostname = s.host, n.secure = s.protocol === "https" || s.protocol === "wss", n.port = s.port, s.query && (n.query = s.query);
    } else n.host && (n.hostname = $i(n.host).host);
    Vr(this, n), this.secure = n.secure != null ? n.secure : typeof location < "u" && location.protocol === "https:", n.hostname && !n.port && (n.port = this.secure ? "443" : "80"), this.hostname = n.hostname || (typeof location < "u" ? location.hostname : "localhost"), this.port = n.port || (typeof location < "u" && location.port ? location.port : this.secure ? "443" : "80"), this.transports = [], this._transportsByName = {}, n.transports.forEach((s) => {
      const r = s.prototype.name;
      this.transports.push(r), this._transportsByName[r] = s;
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
    }, n), this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : ""), typeof this.opts.query == "string" && (this.opts.query = tp(this.opts.query)), Ui && (this.opts.closeOnBeforeunload && (this._beforeunloadEventListener = () => {
      this.transport && (this.transport.removeAllListeners(), this.transport.close());
    }, addEventListener("beforeunload", this._beforeunloadEventListener, !1)), this.hostname !== "localhost" && (this._offlineEventListener = () => {
      this._onClose("transport close", {
        description: "network connection lost"
      });
    }, _r.push(this._offlineEventListener))), this.opts.withCredentials && (this._cookieJar = void 0), this._open();
  }
  /**
   * Creates transport of the given type.
   *
   * @param {String} name - transport name
   * @return {Transport}
   * @private
   */
  createTransport(e) {
    const n = Object.assign({}, this.opts.query);
    n.EIO = _c, n.transport = e, this.id && (n.sid = this.id);
    const s = Object.assign({}, this.opts, {
      query: n,
      socket: this,
      hostname: this.hostname,
      secure: this.secure,
      port: this.port
    }, this.opts.transportOptions[e]);
    return new this._transportsByName[e](s);
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
    const e = this.opts.rememberUpgrade && En.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
    this.readyState = "opening";
    const n = this.createTransport(e);
    n.open(), this.setTransport(n);
  }
  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @private
   */
  setTransport(e) {
    this.transport && this.transport.removeAllListeners(), this.transport = e, e.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (n) => this._onClose("transport close", n));
  }
  /**
   * Called when connection is deemed open.
   *
   * @private
   */
  onOpen() {
    this.readyState = "open", En.priorWebsocketSuccess = this.transport.name === "websocket", this.emitReserved("open"), this.flush();
  }
  /**
   * Handles a packet.
   *
   * @private
   */
  _onPacket(e) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing")
      switch (this.emitReserved("packet", e), this.emitReserved("heartbeat"), e.type) {
        case "open":
          this.onHandshake(JSON.parse(e.data));
          break;
        case "ping":
          this._sendPacket("pong"), this.emitReserved("ping"), this.emitReserved("pong"), this._resetPingTimeout();
          break;
        case "error":
          const n = new Error("server error");
          n.code = e.data, this._onError(n);
          break;
        case "message":
          this.emitReserved("data", e.data), this.emitReserved("message", e.data);
          break;
      }
  }
  /**
   * Called upon handshake completion.
   *
   * @param {Object} data - handshake obj
   * @private
   */
  onHandshake(e) {
    this.emitReserved("handshake", e), this.id = e.sid, this.transport.query.sid = e.sid, this._pingInterval = e.pingInterval, this._pingTimeout = e.pingTimeout, this._maxPayload = e.maxPayload, this.onOpen(), this.readyState !== "closed" && this._resetPingTimeout();
  }
  /**
   * Sets and resets ping timeout timer based on server pings.
   *
   * @private
   */
  _resetPingTimeout() {
    this.clearTimeoutFn(this._pingTimeoutTimer);
    const e = this._pingInterval + this._pingTimeout;
    this._pingTimeoutTime = Date.now() + e, this._pingTimeoutTimer = this.setTimeoutFn(() => {
      this._onClose("ping timeout");
    }, e), this.opts.autoUnref && this._pingTimeoutTimer.unref();
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
      const e = this._getWritablePackets();
      this.transport.send(e), this._prevBufferLen = e.length, this.emitReserved("flush");
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
      const r = this.writeBuffer[s].data;
      if (r && (n += Jd(r)), s > 0 && n > this._maxPayload)
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
    const e = Date.now() > this._pingTimeoutTime;
    return e && (this._pingTimeoutTime = 0, jr(() => {
      this._onClose("ping timeout");
    }, this.setTimeoutFn)), e;
  }
  /**
   * Sends a message.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  write(e, n, s) {
    return this._sendPacket("message", e, n, s), this;
  }
  /**
   * Sends a message. Alias of {@link Socket#write}.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  send(e, n, s) {
    return this._sendPacket("message", e, n, s), this;
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
  _sendPacket(e, n, s, r) {
    if (typeof n == "function" && (r = n, n = void 0), typeof s == "function" && (r = s, s = null), this.readyState === "closing" || this.readyState === "closed")
      return;
    s = s || {}, s.compress = s.compress !== !1;
    const i = {
      type: e,
      data: n,
      options: s
    };
    this.emitReserved("packetCreate", i), this.writeBuffer.push(i), r && this.once("flush", r), this.flush();
  }
  /**
   * Closes the connection.
   */
  close() {
    const e = () => {
      this._onClose("forced close"), this.transport.close();
    }, n = () => {
      this.off("upgrade", n), this.off("upgradeError", n), e();
    }, s = () => {
      this.once("upgrade", n), this.once("upgradeError", n);
    };
    return (this.readyState === "opening" || this.readyState === "open") && (this.readyState = "closing", this.writeBuffer.length ? this.once("drain", () => {
      this.upgrading ? s() : e();
    }) : this.upgrading ? s() : e()), this;
  }
  /**
   * Called upon transport error
   *
   * @private
   */
  _onError(e) {
    if (En.priorWebsocketSuccess = !1, this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening")
      return this.transports.shift(), this._open();
    this.emitReserved("error", e), this._onClose("transport error", e);
  }
  /**
   * Called upon transport close.
   *
   * @private
   */
  _onClose(e, n) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing") {
      if (this.clearTimeoutFn(this._pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), Ui && (this._beforeunloadEventListener && removeEventListener("beforeunload", this._beforeunloadEventListener, !1), this._offlineEventListener)) {
        const s = _r.indexOf(this._offlineEventListener);
        s !== -1 && _r.splice(s, 1);
      }
      this.readyState = "closed", this.id = null, this.emitReserved("close", e, n), this.writeBuffer = [], this._prevBufferLen = 0;
    }
  }
}
En.protocol = _c;
class _p extends En {
  constructor() {
    super(...arguments), this._upgrades = [];
  }
  onOpen() {
    if (super.onOpen(), this.readyState === "open" && this.opts.upgrade)
      for (let e = 0; e < this._upgrades.length; e++)
        this._probe(this._upgrades[e]);
  }
  /**
   * Probes a transport.
   *
   * @param {String} name - transport name
   * @private
   */
  _probe(e) {
    let n = this.createTransport(e), s = !1;
    En.priorWebsocketSuccess = !1;
    const r = () => {
      s || (n.send([{ type: "ping", data: "probe" }]), n.once("packet", (b) => {
        if (!s)
          if (b.type === "pong" && b.data === "probe") {
            if (this.upgrading = !0, this.emitReserved("upgrading", n), !n)
              return;
            En.priorWebsocketSuccess = n.name === "websocket", this.transport.pause(() => {
              s || this.readyState !== "closed" && (c(), this.setTransport(n), n.send([{ type: "upgrade" }]), this.emitReserved("upgrade", n), n = null, this.upgrading = !1, this.flush());
            });
          } else {
            const m = new Error("probe error");
            m.transport = n.name, this.emitReserved("upgradeError", m);
          }
      }));
    };
    function i() {
      s || (s = !0, c(), n.close(), n = null);
    }
    const o = (b) => {
      const m = new Error("probe error: " + b);
      m.transport = n.name, i(), this.emitReserved("upgradeError", m);
    };
    function a() {
      o("transport closed");
    }
    function l() {
      o("socket closed");
    }
    function h(b) {
      n && b.name !== n.name && i();
    }
    const c = () => {
      n.removeListener("open", r), n.removeListener("error", o), n.removeListener("close", a), this.off("close", l), this.off("upgrading", h);
    };
    n.once("open", r), n.once("error", o), n.once("close", a), this.once("close", l), this.once("upgrading", h), this._upgrades.indexOf("webtransport") !== -1 && e !== "webtransport" ? this.setTimeoutFn(() => {
      s || n.open();
    }, 200) : n.open();
  }
  onHandshake(e) {
    this._upgrades = this._filterUpgrades(e.upgrades), super.onHandshake(e);
  }
  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} upgrades - server upgrades
   * @private
   */
  _filterUpgrades(e) {
    const n = [];
    for (let s = 0; s < e.length; s++)
      ~this.transports.indexOf(e[s]) && n.push(e[s]);
    return n;
  }
}
let yp = class extends _p {
  constructor(e, n = {}) {
    const s = typeof e == "object" ? e : n;
    (!s.transports || s.transports && typeof s.transports[0] == "string") && (s.transports = (s.transports || ["polling", "websocket", "webtransport"]).map((r) => hp[r]).filter((r) => !!r)), super(e, s);
  }
};
function vp(t, e = "", n) {
  let s = t;
  n = n || typeof location < "u" && location, t == null && (t = n.protocol + "//" + n.host), typeof t == "string" && (t.charAt(0) === "/" && (t.charAt(1) === "/" ? t = n.protocol + t : t = n.host + t), /^(https?|wss?):\/\//.test(t) || (typeof n < "u" ? t = n.protocol + "//" + t : t = "https://" + t), s = $i(t)), s.port || (/^(http|ws)$/.test(s.protocol) ? s.port = "80" : /^(http|ws)s$/.test(s.protocol) && (s.port = "443")), s.path = s.path || "/";
  const i = s.host.indexOf(":") !== -1 ? "[" + s.host + "]" : s.host;
  return s.id = s.protocol + "://" + i + ":" + s.port + e, s.href = s.protocol + "://" + i + (n && n.port === s.port ? "" : ":" + s.port), s;
}
const bp = typeof ArrayBuffer == "function", wp = (t) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(t) : t.buffer instanceof ArrayBuffer, xc = Object.prototype.toString, kp = typeof Blob == "function" || typeof Blob < "u" && xc.call(Blob) === "[object BlobConstructor]", xp = typeof File == "function" || typeof File < "u" && xc.call(File) === "[object FileConstructor]";
function wo(t) {
  return bp && (t instanceof ArrayBuffer || wp(t)) || kp && t instanceof Blob || xp && t instanceof File;
}
function yr(t, e) {
  if (!t || typeof t != "object")
    return !1;
  if (Array.isArray(t)) {
    for (let n = 0, s = t.length; n < s; n++)
      if (yr(t[n]))
        return !0;
    return !1;
  }
  if (wo(t))
    return !0;
  if (t.toJSON && typeof t.toJSON == "function" && arguments.length === 1)
    return yr(t.toJSON(), !0);
  for (const n in t)
    if (Object.prototype.hasOwnProperty.call(t, n) && yr(t[n]))
      return !0;
  return !1;
}
function Ap(t) {
  const e = [], n = t.data, s = t;
  return s.data = zi(n, e), s.attachments = e.length, { packet: s, buffers: e };
}
function zi(t, e) {
  if (!t)
    return t;
  if (wo(t)) {
    const n = { _placeholder: !0, num: e.length };
    return e.push(t), n;
  } else if (Array.isArray(t)) {
    const n = new Array(t.length);
    for (let s = 0; s < t.length; s++)
      n[s] = zi(t[s], e);
    return n;
  } else if (typeof t == "object" && !(t instanceof Date)) {
    const n = {};
    for (const s in t)
      Object.prototype.hasOwnProperty.call(t, s) && (n[s] = zi(t[s], e));
    return n;
  }
  return t;
}
function Tp(t, e) {
  return t.data = Hi(t.data, e), delete t.attachments, t;
}
function Hi(t, e) {
  if (!t)
    return t;
  if (t && t._placeholder === !0) {
    if (typeof t.num == "number" && t.num >= 0 && t.num < e.length)
      return e[t.num];
    throw new Error("illegal attachments");
  } else if (Array.isArray(t))
    for (let n = 0; n < t.length; n++)
      t[n] = Hi(t[n], e);
  else if (typeof t == "object")
    for (const n in t)
      Object.prototype.hasOwnProperty.call(t, n) && (t[n] = Hi(t[n], e));
  return t;
}
const Sp = [
  "connect",
  "connect_error",
  "disconnect",
  "disconnecting",
  "newListener",
  "removeListener"
  // used by the Node.js EventEmitter
];
var Pe;
(function(t) {
  t[t.CONNECT = 0] = "CONNECT", t[t.DISCONNECT = 1] = "DISCONNECT", t[t.EVENT = 2] = "EVENT", t[t.ACK = 3] = "ACK", t[t.CONNECT_ERROR = 4] = "CONNECT_ERROR", t[t.BINARY_EVENT = 5] = "BINARY_EVENT", t[t.BINARY_ACK = 6] = "BINARY_ACK";
})(Pe || (Pe = {}));
class Ep {
  /**
   * Encoder constructor
   *
   * @param {function} replacer - custom replacer to pass down to JSON.parse
   */
  constructor(e) {
    this.replacer = e;
  }
  /**
   * Encode a packet as a single string if non-binary, or as a
   * buffer sequence, depending on packet type.
   *
   * @param {Object} obj - packet object
   */
  encode(e) {
    return (e.type === Pe.EVENT || e.type === Pe.ACK) && yr(e) ? this.encodeAsBinary({
      type: e.type === Pe.EVENT ? Pe.BINARY_EVENT : Pe.BINARY_ACK,
      nsp: e.nsp,
      data: e.data,
      id: e.id
    }) : [this.encodeAsString(e)];
  }
  /**
   * Encode packet as string.
   */
  encodeAsString(e) {
    let n = "" + e.type;
    return (e.type === Pe.BINARY_EVENT || e.type === Pe.BINARY_ACK) && (n += e.attachments + "-"), e.nsp && e.nsp !== "/" && (n += e.nsp + ","), e.id != null && (n += e.id), e.data != null && (n += JSON.stringify(e.data, this.replacer)), n;
  }
  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   */
  encodeAsBinary(e) {
    const n = Ap(e), s = this.encodeAsString(n.packet), r = n.buffers;
    return r.unshift(s), r;
  }
}
function za(t) {
  return Object.prototype.toString.call(t) === "[object Object]";
}
class ko extends pt {
  /**
   * Decoder constructor
   *
   * @param {function} reviver - custom reviver to pass down to JSON.stringify
   */
  constructor(e) {
    super(), this.reviver = e;
  }
  /**
   * Decodes an encoded packet string into packet JSON.
   *
   * @param {String} obj - encoded packet
   */
  add(e) {
    let n;
    if (typeof e == "string") {
      if (this.reconstructor)
        throw new Error("got plaintext data when reconstructing a packet");
      n = this.decodeString(e);
      const s = n.type === Pe.BINARY_EVENT;
      s || n.type === Pe.BINARY_ACK ? (n.type = s ? Pe.EVENT : Pe.ACK, this.reconstructor = new Cp(n), n.attachments === 0 && super.emitReserved("decoded", n)) : super.emitReserved("decoded", n);
    } else if (wo(e) || e.base64)
      if (this.reconstructor)
        n = this.reconstructor.takeBinaryData(e), n && (this.reconstructor = null, super.emitReserved("decoded", n));
      else
        throw new Error("got binary data when not reconstructing a packet");
    else
      throw new Error("Unknown type: " + e);
  }
  /**
   * Decode a packet String (JSON data)
   *
   * @param {String} str
   * @return {Object} packet
   */
  decodeString(e) {
    let n = 0;
    const s = {
      type: Number(e.charAt(0))
    };
    if (Pe[s.type] === void 0)
      throw new Error("unknown packet type " + s.type);
    if (s.type === Pe.BINARY_EVENT || s.type === Pe.BINARY_ACK) {
      const i = n + 1;
      for (; e.charAt(++n) !== "-" && n != e.length; )
        ;
      const o = e.substring(i, n);
      if (o != Number(o) || e.charAt(n) !== "-")
        throw new Error("Illegal attachments");
      s.attachments = Number(o);
    }
    if (e.charAt(n + 1) === "/") {
      const i = n + 1;
      for (; ++n && !(e.charAt(n) === "," || n === e.length); )
        ;
      s.nsp = e.substring(i, n);
    } else
      s.nsp = "/";
    const r = e.charAt(n + 1);
    if (r !== "" && Number(r) == r) {
      const i = n + 1;
      for (; ++n; ) {
        const o = e.charAt(n);
        if (o == null || Number(o) != o) {
          --n;
          break;
        }
        if (n === e.length)
          break;
      }
      s.id = Number(e.substring(i, n + 1));
    }
    if (e.charAt(++n)) {
      const i = this.tryParse(e.substr(n));
      if (ko.isPayloadValid(s.type, i))
        s.data = i;
      else
        throw new Error("invalid payload");
    }
    return s;
  }
  tryParse(e) {
    try {
      return JSON.parse(e, this.reviver);
    } catch {
      return !1;
    }
  }
  static isPayloadValid(e, n) {
    switch (e) {
      case Pe.CONNECT:
        return za(n);
      case Pe.DISCONNECT:
        return n === void 0;
      case Pe.CONNECT_ERROR:
        return typeof n == "string" || za(n);
      case Pe.EVENT:
      case Pe.BINARY_EVENT:
        return Array.isArray(n) && (typeof n[0] == "number" || typeof n[0] == "string" && Sp.indexOf(n[0]) === -1);
      case Pe.ACK:
      case Pe.BINARY_ACK:
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
class Cp {
  constructor(e) {
    this.packet = e, this.buffers = [], this.reconPack = e;
  }
  /**
   * Method to be called when binary data received from connection
   * after a BINARY_EVENT packet.
   *
   * @param {Buffer | ArrayBuffer} binData - the raw binary data received
   * @return {null | Object} returns null if more binary data is expected or
   *   a reconstructed packet object if all buffers have been received.
   */
  takeBinaryData(e) {
    if (this.buffers.push(e), this.buffers.length === this.reconPack.attachments) {
      const n = Tp(this.reconPack, this.buffers);
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
const Rp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Decoder: ko,
  Encoder: Ep,
  get PacketType() {
    return Pe;
  }
}, Symbol.toStringTag, { value: "Module" }));
function Gt(t, e, n) {
  return t.on(e, n), function() {
    t.off(e, n);
  };
}
const Ip = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
  newListener: 1,
  removeListener: 1
});
class Ac extends pt {
  /**
   * `Socket` constructor.
   */
  constructor(e, n, s) {
    super(), this.connected = !1, this.recovered = !1, this.receiveBuffer = [], this.sendBuffer = [], this._queue = [], this._queueSeq = 0, this.ids = 0, this.acks = {}, this.flags = {}, this.io = e, this.nsp = n, s && s.auth && (this.auth = s.auth), this._opts = Object.assign({}, s), this.io._autoConnect && this.open();
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
    const e = this.io;
    this.subs = [
      Gt(e, "open", this.onopen.bind(this)),
      Gt(e, "packet", this.onpacket.bind(this)),
      Gt(e, "error", this.onerror.bind(this)),
      Gt(e, "close", this.onclose.bind(this))
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
  send(...e) {
    return e.unshift("message"), this.emit.apply(this, e), this;
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
  emit(e, ...n) {
    var s, r, i;
    if (Ip.hasOwnProperty(e))
      throw new Error('"' + e.toString() + '" is a reserved event name');
    if (n.unshift(e), this._opts.retries && !this.flags.fromQueue && !this.flags.volatile)
      return this._addToQueue(n), this;
    const o = {
      type: Pe.EVENT,
      data: n
    };
    if (o.options = {}, o.options.compress = this.flags.compress !== !1, typeof n[n.length - 1] == "function") {
      const c = this.ids++, b = n.pop();
      this._registerAckCallback(c, b), o.id = c;
    }
    const a = (r = (s = this.io.engine) === null || s === void 0 ? void 0 : s.transport) === null || r === void 0 ? void 0 : r.writable, l = this.connected && !(!((i = this.io.engine) === null || i === void 0) && i._hasPingExpired());
    return this.flags.volatile && !a || (l ? (this.notifyOutgoingListeners(o), this.packet(o)) : this.sendBuffer.push(o)), this.flags = {}, this;
  }
  /**
   * @private
   */
  _registerAckCallback(e, n) {
    var s;
    const r = (s = this.flags.timeout) !== null && s !== void 0 ? s : this._opts.ackTimeout;
    if (r === void 0) {
      this.acks[e] = n;
      return;
    }
    const i = this.io.setTimeoutFn(() => {
      delete this.acks[e];
      for (let a = 0; a < this.sendBuffer.length; a++)
        this.sendBuffer[a].id === e && this.sendBuffer.splice(a, 1);
      n.call(this, new Error("operation has timed out"));
    }, r), o = (...a) => {
      this.io.clearTimeoutFn(i), n.apply(this, a);
    };
    o.withError = !0, this.acks[e] = o;
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
  emitWithAck(e, ...n) {
    return new Promise((s, r) => {
      const i = (o, a) => o ? r(o) : s(a);
      i.withError = !0, n.push(i), this.emit(e, ...n);
    });
  }
  /**
   * Add the packet to the queue.
   * @param args
   * @private
   */
  _addToQueue(e) {
    let n;
    typeof e[e.length - 1] == "function" && (n = e.pop());
    const s = {
      id: this._queueSeq++,
      tryCount: 0,
      pending: !1,
      args: e,
      flags: Object.assign({ fromQueue: !0 }, this.flags)
    };
    e.push((r, ...i) => s !== this._queue[0] ? void 0 : (r !== null ? s.tryCount > this._opts.retries && (this._queue.shift(), n && n(r)) : (this._queue.shift(), n && n(null, ...i)), s.pending = !1, this._drainQueue())), this._queue.push(s), this._drainQueue();
  }
  /**
   * Send the first packet of the queue, and wait for an acknowledgement from the server.
   * @param force - whether to resend a packet that has not been acknowledged yet
   *
   * @private
   */
  _drainQueue(e = !1) {
    if (!this.connected || this._queue.length === 0)
      return;
    const n = this._queue[0];
    n.pending && !e || (n.pending = !0, n.tryCount++, this.flags = n.flags, this.emit.apply(this, n.args));
  }
  /**
   * Sends a packet.
   *
   * @param packet
   * @private
   */
  packet(e) {
    e.nsp = this.nsp, this.io._packet(e);
  }
  /**
   * Called upon engine `open`.
   *
   * @private
   */
  onopen() {
    typeof this.auth == "function" ? this.auth((e) => {
      this._sendConnectPacket(e);
    }) : this._sendConnectPacket(this.auth);
  }
  /**
   * Sends a CONNECT packet to initiate the Socket.IO session.
   *
   * @param data
   * @private
   */
  _sendConnectPacket(e) {
    this.packet({
      type: Pe.CONNECT,
      data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, e) : e
    });
  }
  /**
   * Called upon engine or manager `error`.
   *
   * @param err
   * @private
   */
  onerror(e) {
    this.connected || this.emitReserved("connect_error", e);
  }
  /**
   * Called upon engine `close`.
   *
   * @param reason
   * @param description
   * @private
   */
  onclose(e, n) {
    this.connected = !1, delete this.id, this.emitReserved("disconnect", e, n), this._clearAcks();
  }
  /**
   * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
   * the server.
   *
   * @private
   */
  _clearAcks() {
    Object.keys(this.acks).forEach((e) => {
      if (!this.sendBuffer.some((s) => String(s.id) === e)) {
        const s = this.acks[e];
        delete this.acks[e], s.withError && s.call(this, new Error("socket has been disconnected"));
      }
    });
  }
  /**
   * Called with socket packet.
   *
   * @param packet
   * @private
   */
  onpacket(e) {
    if (e.nsp === this.nsp)
      switch (e.type) {
        case Pe.CONNECT:
          e.data && e.data.sid ? this.onconnect(e.data.sid, e.data.pid) : this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          break;
        case Pe.EVENT:
        case Pe.BINARY_EVENT:
          this.onevent(e);
          break;
        case Pe.ACK:
        case Pe.BINARY_ACK:
          this.onack(e);
          break;
        case Pe.DISCONNECT:
          this.ondisconnect();
          break;
        case Pe.CONNECT_ERROR:
          this.destroy();
          const s = new Error(e.data.message);
          s.data = e.data.data, this.emitReserved("connect_error", s);
          break;
      }
  }
  /**
   * Called upon a server event.
   *
   * @param packet
   * @private
   */
  onevent(e) {
    const n = e.data || [];
    e.id != null && n.push(this.ack(e.id)), this.connected ? this.emitEvent(n) : this.receiveBuffer.push(Object.freeze(n));
  }
  emitEvent(e) {
    if (this._anyListeners && this._anyListeners.length) {
      const n = this._anyListeners.slice();
      for (const s of n)
        s.apply(this, e);
    }
    super.emit.apply(this, e), this._pid && e.length && typeof e[e.length - 1] == "string" && (this._lastOffset = e[e.length - 1]);
  }
  /**
   * Produces an ack callback to emit with an event.
   *
   * @private
   */
  ack(e) {
    const n = this;
    let s = !1;
    return function(...r) {
      s || (s = !0, n.packet({
        type: Pe.ACK,
        id: e,
        data: r
      }));
    };
  }
  /**
   * Called upon a server acknowledgement.
   *
   * @param packet
   * @private
   */
  onack(e) {
    const n = this.acks[e.id];
    typeof n == "function" && (delete this.acks[e.id], n.withError && e.data.unshift(null), n.apply(this, e.data));
  }
  /**
   * Called upon server connect.
   *
   * @private
   */
  onconnect(e, n) {
    this.id = e, this.recovered = n && this._pid === n, this._pid = n, this.connected = !0, this.emitBuffered(), this.emitReserved("connect"), this._drainQueue(!0);
  }
  /**
   * Emit buffered events (received and emitted).
   *
   * @private
   */
  emitBuffered() {
    this.receiveBuffer.forEach((e) => this.emitEvent(e)), this.receiveBuffer = [], this.sendBuffer.forEach((e) => {
      this.notifyOutgoingListeners(e), this.packet(e);
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
    this.subs && (this.subs.forEach((e) => e()), this.subs = void 0), this.io._destroy(this);
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
    return this.connected && this.packet({ type: Pe.DISCONNECT }), this.destroy(), this.connected && this.onclose("io client disconnect"), this;
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
  compress(e) {
    return this.flags.compress = e, this;
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
  timeout(e) {
    return this.flags.timeout = e, this;
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
  onAny(e) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.push(e), this;
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
  prependAny(e) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.unshift(e), this;
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
  offAny(e) {
    if (!this._anyListeners)
      return this;
    if (e) {
      const n = this._anyListeners;
      for (let s = 0; s < n.length; s++)
        if (e === n[s])
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
  onAnyOutgoing(e) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.push(e), this;
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
  prependAnyOutgoing(e) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.unshift(e), this;
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
  offAnyOutgoing(e) {
    if (!this._anyOutgoingListeners)
      return this;
    if (e) {
      const n = this._anyOutgoingListeners;
      for (let s = 0; s < n.length; s++)
        if (e === n[s])
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
  notifyOutgoingListeners(e) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const n = this._anyOutgoingListeners.slice();
      for (const s of n)
        s.apply(this, e.data);
    }
  }
}
function rs(t) {
  t = t || {}, this.ms = t.min || 100, this.max = t.max || 1e4, this.factor = t.factor || 2, this.jitter = t.jitter > 0 && t.jitter <= 1 ? t.jitter : 0, this.attempts = 0;
}
rs.prototype.duration = function() {
  var t = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var e = Math.random(), n = Math.floor(e * this.jitter * t);
    t = (Math.floor(e * 10) & 1) == 0 ? t - n : t + n;
  }
  return Math.min(t, this.max) | 0;
};
rs.prototype.reset = function() {
  this.attempts = 0;
};
rs.prototype.setMin = function(t) {
  this.ms = t;
};
rs.prototype.setMax = function(t) {
  this.max = t;
};
rs.prototype.setJitter = function(t) {
  this.jitter = t;
};
class qi extends pt {
  constructor(e, n) {
    var s;
    super(), this.nsps = {}, this.subs = [], e && typeof e == "object" && (n = e, e = void 0), n = n || {}, n.path = n.path || "/socket.io", this.opts = n, Vr(this, n), this.reconnection(n.reconnection !== !1), this.reconnectionAttempts(n.reconnectionAttempts || 1 / 0), this.reconnectionDelay(n.reconnectionDelay || 1e3), this.reconnectionDelayMax(n.reconnectionDelayMax || 5e3), this.randomizationFactor((s = n.randomizationFactor) !== null && s !== void 0 ? s : 0.5), this.backoff = new rs({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    }), this.timeout(n.timeout == null ? 2e4 : n.timeout), this._readyState = "closed", this.uri = e;
    const r = n.parser || Rp;
    this.encoder = new r.Encoder(), this.decoder = new r.Decoder(), this._autoConnect = n.autoConnect !== !1, this._autoConnect && this.open();
  }
  reconnection(e) {
    return arguments.length ? (this._reconnection = !!e, e || (this.skipReconnect = !0), this) : this._reconnection;
  }
  reconnectionAttempts(e) {
    return e === void 0 ? this._reconnectionAttempts : (this._reconnectionAttempts = e, this);
  }
  reconnectionDelay(e) {
    var n;
    return e === void 0 ? this._reconnectionDelay : (this._reconnectionDelay = e, (n = this.backoff) === null || n === void 0 || n.setMin(e), this);
  }
  randomizationFactor(e) {
    var n;
    return e === void 0 ? this._randomizationFactor : (this._randomizationFactor = e, (n = this.backoff) === null || n === void 0 || n.setJitter(e), this);
  }
  reconnectionDelayMax(e) {
    var n;
    return e === void 0 ? this._reconnectionDelayMax : (this._reconnectionDelayMax = e, (n = this.backoff) === null || n === void 0 || n.setMax(e), this);
  }
  timeout(e) {
    return arguments.length ? (this._timeout = e, this) : this._timeout;
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
  open(e) {
    if (~this._readyState.indexOf("open"))
      return this;
    this.engine = new yp(this.uri, this.opts);
    const n = this.engine, s = this;
    this._readyState = "opening", this.skipReconnect = !1;
    const r = Gt(n, "open", function() {
      s.onopen(), e && e();
    }), i = (a) => {
      this.cleanup(), this._readyState = "closed", this.emitReserved("error", a), e ? e(a) : this.maybeReconnectOnOpen();
    }, o = Gt(n, "error", i);
    if (this._timeout !== !1) {
      const a = this._timeout, l = this.setTimeoutFn(() => {
        r(), i(new Error("timeout")), n.close();
      }, a);
      this.opts.autoUnref && l.unref(), this.subs.push(() => {
        this.clearTimeoutFn(l);
      });
    }
    return this.subs.push(r), this.subs.push(o), this;
  }
  /**
   * Alias for open()
   *
   * @return self
   * @public
   */
  connect(e) {
    return this.open(e);
  }
  /**
   * Called upon transport open.
   *
   * @private
   */
  onopen() {
    this.cleanup(), this._readyState = "open", this.emitReserved("open");
    const e = this.engine;
    this.subs.push(
      Gt(e, "ping", this.onping.bind(this)),
      Gt(e, "data", this.ondata.bind(this)),
      Gt(e, "error", this.onerror.bind(this)),
      Gt(e, "close", this.onclose.bind(this)),
      // @ts-ignore
      Gt(this.decoder, "decoded", this.ondecoded.bind(this))
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
  ondata(e) {
    try {
      this.decoder.add(e);
    } catch (n) {
      this.onclose("parse error", n);
    }
  }
  /**
   * Called when parser fully decodes a packet.
   *
   * @private
   */
  ondecoded(e) {
    jr(() => {
      this.emitReserved("packet", e);
    }, this.setTimeoutFn);
  }
  /**
   * Called upon socket error.
   *
   * @private
   */
  onerror(e) {
    this.emitReserved("error", e);
  }
  /**
   * Creates a new socket for the given `nsp`.
   *
   * @return {Socket}
   * @public
   */
  socket(e, n) {
    let s = this.nsps[e];
    return s ? this._autoConnect && !s.active && s.connect() : (s = new Ac(this, e, n), this.nsps[e] = s), s;
  }
  /**
   * Called upon a socket close.
   *
   * @param socket
   * @private
   */
  _destroy(e) {
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
  _packet(e) {
    const n = this.encoder.encode(e);
    for (let s = 0; s < n.length; s++)
      this.engine.write(n[s], e.options);
  }
  /**
   * Clean up transport subscriptions and packet buffer.
   *
   * @private
   */
  cleanup() {
    this.subs.forEach((e) => e()), this.subs.length = 0, this.decoder.destroy();
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
  onclose(e, n) {
    var s;
    this.cleanup(), (s = this.engine) === null || s === void 0 || s.close(), this.backoff.reset(), this._readyState = "closed", this.emitReserved("close", e, n), this._reconnection && !this.skipReconnect && this.reconnect();
  }
  /**
   * Attempt a reconnection.
   *
   * @private
   */
  reconnect() {
    if (this._reconnecting || this.skipReconnect)
      return this;
    const e = this;
    if (this.backoff.attempts >= this._reconnectionAttempts)
      this.backoff.reset(), this.emitReserved("reconnect_failed"), this._reconnecting = !1;
    else {
      const n = this.backoff.duration();
      this._reconnecting = !0;
      const s = this.setTimeoutFn(() => {
        e.skipReconnect || (this.emitReserved("reconnect_attempt", e.backoff.attempts), !e.skipReconnect && e.open((r) => {
          r ? (e._reconnecting = !1, e.reconnect(), this.emitReserved("reconnect_error", r)) : e.onreconnect();
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
    const e = this.backoff.attempts;
    this._reconnecting = !1, this.backoff.reset(), this.emitReserved("reconnect", e);
  }
}
const Ss = {};
function vr(t, e) {
  typeof t == "object" && (e = t, t = void 0), e = e || {};
  const n = vp(t, e.path || "/socket.io"), s = n.source, r = n.id, i = n.path, o = Ss[r] && i in Ss[r].nsps, a = e.forceNew || e["force new connection"] || e.multiplex === !1 || o;
  let l;
  return a ? l = new qi(s, e) : (Ss[r] || (Ss[r] = new qi(s, e)), l = Ss[r]), n.query && !e.query && (e.query = n.queryKey), l.socket(n.path, e);
}
Object.assign(vr, {
  Manager: qi,
  Socket: Ac,
  io: vr,
  connect: vr
});
function Lp() {
  const t = ce([]), e = ce(!1), n = ce(""), s = ce(!1), r = ce(!1), i = ce(!1), o = ce("connecting"), a = ce(0), l = 5, h = ce({}), c = ce(null), b = ce("");
  let m = null, P = null, $ = null, j = null, Le, te;
  const Re = (q) => {
    Le = q, q && localStorage.setItem("ctid", q);
  }, xe = (q) => {
    te = q;
  }, z = (q) => {
    var Ie;
    const de = Le || localStorage.getItem("ctid"), se = {};
    de && (se.conversation_token = de), te && (se.widget_id = te);
    try {
      se.page_url = window.parent !== window && ((Ie = window.parent.location) != null && Ie.href) ? window.parent.location.href : document.referrer || window.location.href;
    } catch {
      se.page_url = document.referrer || "";
    }
    return m = vr(`${Ws.WS_URL}/widget`, {
      transports: ["websocket"],
      reconnection: !0,
      reconnectionAttempts: l,
      reconnectionDelay: 1e3,
      auth: Object.keys(se).length > 0 ? se : void 0
    }), m.on("connect", () => {
      o.value = "connected", a.value = 0;
    }), m.on("disconnect", () => {
      o.value === "connected" && (console.log("Socket disconnected, setting connection status to connecting"), o.value = "connecting");
    }), m.on("connect_error", () => {
      a.value++, console.error("Socket connection failed, attempt:", a.value, "connection status:", o.value), a.value >= l && (o.value = "failed");
    }), m.on("chat_response", (K) => {
      if (e.value = !1, K.session_id ? (console.log("Captured session_id from chat_response:", K.session_id), b.value = K.session_id) : console.warn("No session_id in chat_response data:", K), K.type === "agent_message") {
        const Qe = {
          message: K.message,
          message_type: "agent",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          session_id: "",
          agent_name: K.agent_name,
          stream: !0,
          // live reply → client-side typewriter reveal
          attributes: {
            end_chat: K.end_chat,
            end_chat_reason: K.end_chat_reason,
            end_chat_description: K.end_chat_description,
            request_rating: K.request_rating
          }
        };
        K.attachments && Array.isArray(K.attachments) && (Qe.id = K.message_id, Qe.attachments = K.attachments.map((ut, vt) => ({
          id: K.message_id * 1e3 + vt,
          filename: ut.filename,
          file_url: ut.file_url,
          content_type: ut.content_type,
          file_size: ut.file_size
        }))), t.value.push(Qe);
      } else K.shopify_output && typeof K.shopify_output == "object" && K.shopify_output.products ? t.value.push({
        message: K.message,
        // Keep the accompanying text message
        message_type: "product",
        // Use 'product' type for rendering
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: "",
        agent_name: K.agent_name,
        // Assign the whole structured object
        shopify_output: K.shopify_output,
        // Remove the old flattened fields (product_id, product_title, etc.)
        attributes: {
          // Keep other attributes if needed
          end_chat: K.end_chat,
          request_rating: K.request_rating
        }
      }) : t.value.push({
        message: K.message,
        message_type: "bot",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: "",
        agent_name: K.agent_name,
        stream: !0,
        // live reply → client-side typewriter reveal
        // Knowledge-base citations (display gated by show_citations in the widget)
        sources: Array.isArray(K.sources) && K.sources.length ? K.sources : void 0,
        attributes: {
          end_chat: K.end_chat,
          end_chat_reason: K.end_chat_reason,
          end_chat_description: K.end_chat_description,
          request_rating: K.request_rating
        }
      });
    }), m.on("handle_taken_over", (K) => {
      t.value.push({
        message: `${K.user_name} joined the conversation`,
        message_type: "system",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: K.session_id
      }), h.value = {
        ...h.value,
        human_agent_name: K.user_name,
        human_agent_profile_pic: K.profile_picture
      }, P && P(K);
    }), m.on("session_initialized", (K) => {
      K.session_id && (console.log("Initialized session_id from session_initialized:", K.session_id), b.value = K.session_id);
    }), m.on("error", Ve), m.on("chat_history", Te), m.on("rating_submitted", me), m.on("display_form", Ke), m.on("form_submitted", Je), m.on("workflow_state", ct), m.on("workflow_proceeded", ae), m;
  }, W = async () => {
    try {
      return o.value = "connecting", a.value = 0, m && (m.removeAllListeners(), m.disconnect(), m = null), m = z(""), new Promise((q) => {
        m == null || m.on("connect", () => {
          q(!0);
        }), m == null || m.on("connect_error", () => {
          a.value >= l && q(!1);
        });
      });
    } catch (q) {
      return console.error("Socket initialization failed:", q), o.value = "failed", !1;
    }
  }, ne = () => (m && m.disconnect(), W()), V = (q) => {
    P = q;
  }, Fe = (q) => {
    $ = q;
  }, it = (q) => {
    j = q;
  }, Ve = (q) => {
    e.value = !1, n.value = Ah(q), s.value = !0, setTimeout(() => {
      s.value = !1, n.value = "";
    }, 5e3);
  }, Te = (q) => {
    if (q.type === "chat_history" && Array.isArray(q.messages)) {
      const de = q.messages.map((se) => {
        var K, Qe;
        const Ie = {
          message: se.message,
          message_type: se.message_type,
          created_at: se.created_at,
          session_id: "",
          agent_name: se.agent_name || "",
          user_name: se.user_name || "",
          attributes: se.attributes || {},
          attachments: se.attachments || []
          // Include attachments
        };
        return Array.isArray((K = se.attributes) == null ? void 0 : K.sources) && se.attributes.sources.length && (Ie.sources = se.attributes.sources), (Qe = se.attributes) != null && Qe.shopify_output && typeof se.attributes.shopify_output == "object" ? {
          ...Ie,
          message_type: "product",
          shopify_output: se.attributes.shopify_output
        } : Ie;
      });
      t.value = [
        ...de.filter(
          (se) => !t.value.some(
            (Ie) => Ie.message === se.message && Ie.created_at === se.created_at
          )
        ),
        ...t.value
      ];
    }
  }, me = (q) => {
    q.success && t.value.push({
      message: "Thank you for your feedback!",
      message_type: "system",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: ""
    });
  }, Ke = (q) => {
    var de;
    console.log("Form display handler in composable:", q), e.value = !1, c.value = q.form_data, console.log("Set currentForm in handleDisplayForm:", c.value), ((de = q.form_data) == null ? void 0 : de.form_full_screen) === !0 ? (console.log("Full screen form detected, triggering workflow state callback"), $ && $({
      type: "form",
      form_data: q.form_data,
      session_id: q.session_id
    })) : t.value.push({
      message: "",
      message_type: "form",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: q.session_id,
      attributes: {
        form_data: q.form_data
      }
    });
  }, Je = (q) => {
    console.log("Form submitted confirmation received, clearing currentForm"), c.value = null, q.success && console.log("Form submitted successfully");
  }, ct = (q) => {
    console.log("Workflow state received in composable:", q), (q.type === "form" || q.type === "display_form") && (console.log("Setting currentForm from workflow state:", q.form_data), c.value = q.form_data), $ && $(q);
  }, ae = (q) => {
    console.log("Workflow proceeded in composable:", q), j && j(q);
  };
  return {
    messages: t,
    loading: e,
    errorMessage: n,
    showError: s,
    loadingHistory: r,
    hasStartedChat: i,
    connectionStatus: o,
    sendMessage: async (q, de, se = []) => {
      if (!m || !q.trim() && se.length === 0) return;
      h.value.human_agent_name || (e.value = !0);
      const Ie = {
        message: q,
        message_type: "user",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: ""
      };
      se.length > 0 && (Ie.attachments = se.map((K, Qe) => {
        let ut = "";
        if (K.content_type.startsWith("image/")) {
          const vt = atob(K.content), p = new Array(vt.length);
          for (let O = 0; O < vt.length; O++)
            p[O] = vt.charCodeAt(O);
          const y = new Uint8Array(p), k = new Blob([y], { type: K.content_type });
          ut = URL.createObjectURL(k);
        }
        return {
          id: Date.now() * 1e3 + Qe,
          // Temporary ID
          filename: K.filename,
          file_url: ut,
          // Temporary blob URL, will be replaced
          content_type: K.content_type,
          file_size: K.size,
          _isTemporary: !0
          // Flag to identify temporary attachments
        };
      })), t.value.push(Ie), m.emit("chat", {
        message: q,
        email: de,
        files: se
        // Send files with base64 content
      }), i.value = !0;
    },
    loadChatHistory: async () => {
      if (m)
        try {
          r.value = !0, m.emit("get_chat_history");
        } catch (q) {
          console.error("Failed to load chat history:", q);
        } finally {
          r.value = !1;
        }
    },
    connect: W,
    reconnect: ne,
    cleanup: () => {
      m && (m.removeAllListeners(), m.disconnect(), m = null), P = null, $ = null, j = null;
    },
    humanAgent: h,
    onTakeover: V,
    submitRating: async (q, de) => {
      !m || !q || m.emit("submit_rating", {
        rating: q,
        feedback: de
      });
    },
    currentForm: c,
    submitForm: async (q) => {
      var Ie;
      if (console.log("Submitting form in socket:", q), console.log("Current form in socket:", c.value), console.log("Socket in socket:", m), !m) {
        console.error("No socket available for form submission");
        return;
      }
      if (!q || Object.keys(q).length === 0) {
        console.error("No form data to submit");
        return;
      }
      const se = ((Ie = c.value) == null ? void 0 : Ie.form_type) === "contact" ? "submit_contact_info" : "submit_form";
      console.log(`Emitting ${se} event with data:`, q), m.emit(se, {
        form_data: q
      }), c.value = null;
    },
    getWorkflowState: async () => {
      m && (console.log("Getting workflow state 12"), m.emit("get_workflow_state"));
    },
    proceedWorkflow: async () => {
      m && m.emit("proceed_workflow", {});
    },
    onWorkflowState: Fe,
    onWorkflowProceeded: it,
    currentSessionId: b,
    setToken: Re,
    setWidgetId: xe
  };
}
function Op(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var yi = { exports: {} }, Ha;
function Pp() {
  return Ha || (Ha = 1, function(t) {
    (function() {
      function e(f, v, A) {
        return f.call.apply(f.bind, arguments);
      }
      function n(f, v, A) {
        if (!f) throw Error();
        if (2 < arguments.length) {
          var x = Array.prototype.slice.call(arguments, 2);
          return function() {
            var F = Array.prototype.slice.call(arguments);
            return Array.prototype.unshift.apply(F, x), f.apply(v, F);
          };
        }
        return function() {
          return f.apply(v, arguments);
        };
      }
      function s(f, v, A) {
        return s = Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1 ? e : n, s.apply(null, arguments);
      }
      var r = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      function i(f, v) {
        this.a = f, this.o = v || f, this.c = this.o.document;
      }
      var o = !!window.FontFace;
      function a(f, v, A, x) {
        if (v = f.c.createElement(v), A) for (var F in A) A.hasOwnProperty(F) && (F == "style" ? v.style.cssText = A[F] : v.setAttribute(F, A[F]));
        return x && v.appendChild(f.c.createTextNode(x)), v;
      }
      function l(f, v, A) {
        f = f.c.getElementsByTagName(v)[0], f || (f = document.documentElement), f.insertBefore(A, f.lastChild);
      }
      function h(f) {
        f.parentNode && f.parentNode.removeChild(f);
      }
      function c(f, v, A) {
        v = v || [], A = A || [];
        for (var x = f.className.split(/\s+/), F = 0; F < v.length; F += 1) {
          for (var Y = !1, ee = 0; ee < x.length; ee += 1) if (v[F] === x[ee]) {
            Y = !0;
            break;
          }
          Y || x.push(v[F]);
        }
        for (v = [], F = 0; F < x.length; F += 1) {
          for (Y = !1, ee = 0; ee < A.length; ee += 1) if (x[F] === A[ee]) {
            Y = !0;
            break;
          }
          Y || v.push(x[F]);
        }
        f.className = v.join(" ").replace(/\s+/g, " ").replace(/^\s+|\s+$/, "");
      }
      function b(f, v) {
        for (var A = f.className.split(/\s+/), x = 0, F = A.length; x < F; x++) if (A[x] == v) return !0;
        return !1;
      }
      function m(f) {
        return f.o.location.hostname || f.a.location.hostname;
      }
      function P(f, v, A) {
        function x() {
          be && F && Y && (be(ee), be = null);
        }
        v = a(f, "link", { rel: "stylesheet", href: v, media: "all" });
        var F = !1, Y = !0, ee = null, be = A || null;
        o ? (v.onload = function() {
          F = !0, x();
        }, v.onerror = function() {
          F = !0, ee = Error("Stylesheet failed to load"), x();
        }) : setTimeout(function() {
          F = !0, x();
        }, 0), l(f, "head", v);
      }
      function $(f, v, A, x) {
        var F = f.c.getElementsByTagName("head")[0];
        if (F) {
          var Y = a(f, "script", { src: v }), ee = !1;
          return Y.onload = Y.onreadystatechange = function() {
            ee || this.readyState && this.readyState != "loaded" && this.readyState != "complete" || (ee = !0, A && A(null), Y.onload = Y.onreadystatechange = null, Y.parentNode.tagName == "HEAD" && F.removeChild(Y));
          }, F.appendChild(Y), setTimeout(function() {
            ee || (ee = !0, A && A(Error("Script load timeout")));
          }, x || 5e3), Y;
        }
        return null;
      }
      function j() {
        this.a = 0, this.c = null;
      }
      function Le(f) {
        return f.a++, function() {
          f.a--, Re(f);
        };
      }
      function te(f, v) {
        f.c = v, Re(f);
      }
      function Re(f) {
        f.a == 0 && f.c && (f.c(), f.c = null);
      }
      function xe(f) {
        this.a = f || "-";
      }
      xe.prototype.c = function(f) {
        for (var v = [], A = 0; A < arguments.length; A++) v.push(arguments[A].replace(/[\W_]+/g, "").toLowerCase());
        return v.join(this.a);
      };
      function z(f, v) {
        this.c = f, this.f = 4, this.a = "n";
        var A = (v || "n4").match(/^([nio])([1-9])$/i);
        A && (this.a = A[1], this.f = parseInt(A[2], 10));
      }
      function W(f) {
        return Fe(f) + " " + (f.f + "00") + " 300px " + ne(f.c);
      }
      function ne(f) {
        var v = [];
        f = f.split(/,\s*/);
        for (var A = 0; A < f.length; A++) {
          var x = f[A].replace(/['"]/g, "");
          x.indexOf(" ") != -1 || /^\d/.test(x) ? v.push("'" + x + "'") : v.push(x);
        }
        return v.join(",");
      }
      function V(f) {
        return f.a + f.f;
      }
      function Fe(f) {
        var v = "normal";
        return f.a === "o" ? v = "oblique" : f.a === "i" && (v = "italic"), v;
      }
      function it(f) {
        var v = 4, A = "n", x = null;
        return f && ((x = f.match(/(normal|oblique|italic)/i)) && x[1] && (A = x[1].substr(0, 1).toLowerCase()), (x = f.match(/([1-9]00|normal|bold)/i)) && x[1] && (/bold/i.test(x[1]) ? v = 7 : /[1-9]00/.test(x[1]) && (v = parseInt(x[1].substr(0, 1), 10)))), A + v;
      }
      function Ve(f, v) {
        this.c = f, this.f = f.o.document.documentElement, this.h = v, this.a = new xe("-"), this.j = v.events !== !1, this.g = v.classes !== !1;
      }
      function Te(f) {
        f.g && c(f.f, [f.a.c("wf", "loading")]), Ke(f, "loading");
      }
      function me(f) {
        if (f.g) {
          var v = b(f.f, f.a.c("wf", "active")), A = [], x = [f.a.c("wf", "loading")];
          v || A.push(f.a.c("wf", "inactive")), c(f.f, A, x);
        }
        Ke(f, "inactive");
      }
      function Ke(f, v, A) {
        f.j && f.h[v] && (A ? f.h[v](A.c, V(A)) : f.h[v]());
      }
      function Je() {
        this.c = {};
      }
      function ct(f, v, A) {
        var x = [], F;
        for (F in v) if (v.hasOwnProperty(F)) {
          var Y = f.c[F];
          Y && x.push(Y(v[F], A));
        }
        return x;
      }
      function ae(f, v) {
        this.c = f, this.f = v, this.a = a(this.c, "span", { "aria-hidden": "true" }, this.f);
      }
      function _e(f) {
        l(f.c, "body", f.a);
      }
      function le(f) {
        return "display:block;position:absolute;top:-9999px;left:-9999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:" + ne(f.c) + ";" + ("font-style:" + Fe(f) + ";font-weight:" + (f.f + "00") + ";");
      }
      function ft(f, v, A, x, F, Y) {
        this.g = f, this.j = v, this.a = x, this.c = A, this.f = F || 3e3, this.h = Y || void 0;
      }
      ft.prototype.start = function() {
        var f = this.c.o.document, v = this, A = r(), x = new Promise(function(ee, be) {
          function Se() {
            r() - A >= v.f ? be() : f.fonts.load(W(v.a), v.h).then(function(Ge) {
              1 <= Ge.length ? ee() : setTimeout(Se, 25);
            }, function() {
              be();
            });
          }
          Se();
        }), F = null, Y = new Promise(function(ee, be) {
          F = setTimeout(be, v.f);
        });
        Promise.race([Y, x]).then(function() {
          F && (clearTimeout(F), F = null), v.g(v.a);
        }, function() {
          v.j(v.a);
        });
      };
      function ot(f, v, A, x, F, Y, ee) {
        this.v = f, this.B = v, this.c = A, this.a = x, this.s = ee || "BESbswy", this.f = {}, this.w = F || 3e3, this.u = Y || null, this.m = this.j = this.h = this.g = null, this.g = new ae(this.c, this.s), this.h = new ae(this.c, this.s), this.j = new ae(this.c, this.s), this.m = new ae(this.c, this.s), f = new z(this.a.c + ",serif", V(this.a)), f = le(f), this.g.a.style.cssText = f, f = new z(this.a.c + ",sans-serif", V(this.a)), f = le(f), this.h.a.style.cssText = f, f = new z("serif", V(this.a)), f = le(f), this.j.a.style.cssText = f, f = new z("sans-serif", V(this.a)), f = le(f), this.m.a.style.cssText = f, _e(this.g), _e(this.h), _e(this.j), _e(this.m);
      }
      var ie = { D: "serif", C: "sans-serif" }, nt = null;
      function ve() {
        if (nt === null) {
          var f = /AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent);
          nt = !!f && (536 > parseInt(f[1], 10) || parseInt(f[1], 10) === 536 && 11 >= parseInt(f[2], 10));
        }
        return nt;
      }
      ot.prototype.start = function() {
        this.f.serif = this.j.a.offsetWidth, this.f["sans-serif"] = this.m.a.offsetWidth, this.A = r(), de(this);
      };
      function q(f, v, A) {
        for (var x in ie) if (ie.hasOwnProperty(x) && v === f.f[ie[x]] && A === f.f[ie[x]]) return !0;
        return !1;
      }
      function de(f) {
        var v = f.g.a.offsetWidth, A = f.h.a.offsetWidth, x;
        (x = v === f.f.serif && A === f.f["sans-serif"]) || (x = ve() && q(f, v, A)), x ? r() - f.A >= f.w ? ve() && q(f, v, A) && (f.u === null || f.u.hasOwnProperty(f.a.c)) ? Ie(f, f.v) : Ie(f, f.B) : se(f) : Ie(f, f.v);
      }
      function se(f) {
        setTimeout(s(function() {
          de(this);
        }, f), 50);
      }
      function Ie(f, v) {
        setTimeout(s(function() {
          h(this.g.a), h(this.h.a), h(this.j.a), h(this.m.a), v(this.a);
        }, f), 0);
      }
      function K(f, v, A) {
        this.c = f, this.a = v, this.f = 0, this.m = this.j = !1, this.s = A;
      }
      var Qe = null;
      K.prototype.g = function(f) {
        var v = this.a;
        v.g && c(v.f, [v.a.c("wf", f.c, V(f).toString(), "active")], [v.a.c("wf", f.c, V(f).toString(), "loading"), v.a.c("wf", f.c, V(f).toString(), "inactive")]), Ke(v, "fontactive", f), this.m = !0, ut(this);
      }, K.prototype.h = function(f) {
        var v = this.a;
        if (v.g) {
          var A = b(v.f, v.a.c("wf", f.c, V(f).toString(), "active")), x = [], F = [v.a.c("wf", f.c, V(f).toString(), "loading")];
          A || x.push(v.a.c("wf", f.c, V(f).toString(), "inactive")), c(v.f, x, F);
        }
        Ke(v, "fontinactive", f), ut(this);
      };
      function ut(f) {
        --f.f == 0 && f.j && (f.m ? (f = f.a, f.g && c(f.f, [f.a.c("wf", "active")], [f.a.c("wf", "loading"), f.a.c("wf", "inactive")]), Ke(f, "active")) : me(f.a));
      }
      function vt(f) {
        this.j = f, this.a = new Je(), this.h = 0, this.f = this.g = !0;
      }
      vt.prototype.load = function(f) {
        this.c = new i(this.j, f.context || this.j), this.g = f.events !== !1, this.f = f.classes !== !1, y(this, new Ve(this.c, f), f);
      };
      function p(f, v, A, x, F) {
        var Y = --f.h == 0;
        (f.f || f.g) && setTimeout(function() {
          var ee = F || null, be = x || null || {};
          if (A.length === 0 && Y) me(v.a);
          else {
            v.f += A.length, Y && (v.j = Y);
            var Se, Ge = [];
            for (Se = 0; Se < A.length; Se++) {
              var Me = A[Se], dt = be[Me.c], bt = v.a, We = Me;
              if (bt.g && c(bt.f, [bt.a.c("wf", We.c, V(We).toString(), "loading")]), Ke(bt, "fontloading", We), bt = null, Qe === null) if (window.FontFace) {
                var We = /Gecko.*Firefox\/(\d+)/.exec(window.navigator.userAgent), Xt = /OS X.*Version\/10\..*Safari/.exec(window.navigator.userAgent) && /Apple/.exec(window.navigator.vendor);
                Qe = We ? 42 < parseInt(We[1], 10) : !Xt;
              } else Qe = !1;
              Qe ? bt = new ft(s(v.g, v), s(v.h, v), v.c, Me, v.s, dt) : bt = new ot(s(v.g, v), s(v.h, v), v.c, Me, v.s, ee, dt), Ge.push(bt);
            }
            for (Se = 0; Se < Ge.length; Se++) Ge[Se].start();
          }
        }, 0);
      }
      function y(f, v, A) {
        var F = [], x = A.timeout;
        Te(v);
        var F = ct(f.a, A, f.c), Y = new K(f.c, v, x);
        for (f.h = F.length, v = 0, A = F.length; v < A; v++) F[v].load(function(ee, be, Se) {
          p(f, Y, ee, be, Se);
        });
      }
      function k(f, v) {
        this.c = f, this.a = v;
      }
      k.prototype.load = function(f) {
        function v() {
          if (Y["__mti_fntLst" + x]) {
            var ee = Y["__mti_fntLst" + x](), be = [], Se;
            if (ee) for (var Ge = 0; Ge < ee.length; Ge++) {
              var Me = ee[Ge].fontfamily;
              ee[Ge].fontStyle != null && ee[Ge].fontWeight != null ? (Se = ee[Ge].fontStyle + ee[Ge].fontWeight, be.push(new z(Me, Se))) : be.push(new z(Me));
            }
            f(be);
          } else setTimeout(function() {
            v();
          }, 50);
        }
        var A = this, x = A.a.projectId, F = A.a.version;
        if (x) {
          var Y = A.c.o;
          $(this.c, (A.a.api || "https://fast.fonts.net/jsapi") + "/" + x + ".js" + (F ? "?v=" + F : ""), function(ee) {
            ee ? f([]) : (Y["__MonotypeConfiguration__" + x] = function() {
              return A.a;
            }, v());
          }).id = "__MonotypeAPIScript__" + x;
        } else f([]);
      };
      function O(f, v) {
        this.c = f, this.a = v;
      }
      O.prototype.load = function(f) {
        var v, A, x = this.a.urls || [], F = this.a.families || [], Y = this.a.testStrings || {}, ee = new j();
        for (v = 0, A = x.length; v < A; v++) P(this.c, x[v], Le(ee));
        var be = [];
        for (v = 0, A = F.length; v < A; v++) if (x = F[v].split(":"), x[1]) for (var Se = x[1].split(","), Ge = 0; Ge < Se.length; Ge += 1) be.push(new z(x[0], Se[Ge]));
        else be.push(new z(x[0]));
        te(ee, function() {
          f(be, Y);
        });
      };
      function R(f, v) {
        f ? this.c = f : this.c = L, this.a = [], this.f = [], this.g = v || "";
      }
      var L = "https://fonts.googleapis.com/css";
      function B(f, v) {
        for (var A = v.length, x = 0; x < A; x++) {
          var F = v[x].split(":");
          F.length == 3 && f.f.push(F.pop());
          var Y = "";
          F.length == 2 && F[1] != "" && (Y = ":"), f.a.push(F.join(Y));
        }
      }
      function D(f) {
        if (f.a.length == 0) throw Error("No fonts to load!");
        if (f.c.indexOf("kit=") != -1) return f.c;
        for (var v = f.a.length, A = [], x = 0; x < v; x++) A.push(f.a[x].replace(/ /g, "+"));
        return v = f.c + "?family=" + A.join("%7C"), 0 < f.f.length && (v += "&subset=" + f.f.join(",")), 0 < f.g.length && (v += "&text=" + encodeURIComponent(f.g)), v;
      }
      function M(f) {
        this.f = f, this.a = [], this.c = {};
      }
      var N = { latin: "BESbswy", "latin-ext": "çöüğş", cyrillic: "йяЖ", greek: "αβΣ", khmer: "កខគ", Hanuman: "កខគ" }, X = { thin: "1", extralight: "2", "extra-light": "2", ultralight: "2", "ultra-light": "2", light: "3", regular: "4", book: "4", medium: "5", "semi-bold": "6", semibold: "6", "demi-bold": "6", demibold: "6", bold: "7", "extra-bold": "8", extrabold: "8", "ultra-bold": "8", ultrabold: "8", black: "9", heavy: "9", l: "3", r: "4", b: "7" }, U = { i: "i", italic: "i", n: "n", normal: "n" }, G = /^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/;
      function Q(f) {
        for (var v = f.f.length, A = 0; A < v; A++) {
          var x = f.f[A].split(":"), F = x[0].replace(/\+/g, " "), Y = ["n4"];
          if (2 <= x.length) {
            var ee, be = x[1];
            if (ee = [], be) for (var be = be.split(","), Se = be.length, Ge = 0; Ge < Se; Ge++) {
              var Me;
              if (Me = be[Ge], Me.match(/^[\w-]+$/)) {
                var dt = G.exec(Me.toLowerCase());
                if (dt == null) Me = "";
                else {
                  if (Me = dt[2], Me = Me == null || Me == "" ? "n" : U[Me], dt = dt[1], dt == null || dt == "") dt = "4";
                  else var bt = X[dt], dt = bt || (isNaN(dt) ? "4" : dt.substr(0, 1));
                  Me = [Me, dt].join("");
                }
              } else Me = "";
              Me && ee.push(Me);
            }
            0 < ee.length && (Y = ee), x.length == 3 && (x = x[2], ee = [], x = x ? x.split(",") : ee, 0 < x.length && (x = N[x[0]]) && (f.c[F] = x));
          }
          for (f.c[F] || (x = N[F]) && (f.c[F] = x), x = 0; x < Y.length; x += 1) f.a.push(new z(F, Y[x]));
        }
      }
      function ue(f, v) {
        this.c = f, this.a = v;
      }
      var Oe = { Arimo: !0, Cousine: !0, Tinos: !0 };
      ue.prototype.load = function(f) {
        var v = new j(), A = this.c, x = new R(this.a.api, this.a.text), F = this.a.families;
        B(x, F);
        var Y = new M(F);
        Q(Y), P(A, D(x), Le(v)), te(v, function() {
          f(Y.a, Y.c, Oe);
        });
      };
      function pe(f, v) {
        this.c = f, this.a = v;
      }
      pe.prototype.load = function(f) {
        var v = this.a.id, A = this.c.o;
        v ? $(this.c, (this.a.api || "https://use.typekit.net") + "/" + v + ".js", function(x) {
          if (x) f([]);
          else if (A.Typekit && A.Typekit.config && A.Typekit.config.fn) {
            x = A.Typekit.config.fn;
            for (var F = [], Y = 0; Y < x.length; Y += 2) for (var ee = x[Y], be = x[Y + 1], Se = 0; Se < be.length; Se++) F.push(new z(ee, be[Se]));
            try {
              A.Typekit.load({ events: !1, classes: !1, async: !0 });
            } catch {
            }
            f(F);
          }
        }, 2e3) : f([]);
      };
      function De(f, v) {
        this.c = f, this.f = v, this.a = [];
      }
      De.prototype.load = function(f) {
        var v = this.f.id, A = this.c.o, x = this;
        v ? (A.__webfontfontdeckmodule__ || (A.__webfontfontdeckmodule__ = {}), A.__webfontfontdeckmodule__[v] = function(F, Y) {
          for (var ee = 0, be = Y.fonts.length; ee < be; ++ee) {
            var Se = Y.fonts[ee];
            x.a.push(new z(Se.name, it("font-weight:" + Se.weight + ";font-style:" + Se.style)));
          }
          f(x.a);
        }, $(this.c, (this.f.api || "https://f.fontdeck.com/s/css/js/") + m(this.c) + "/" + v + ".js", function(F) {
          F && f([]);
        })) : f([]);
      };
      var Be = new vt(window);
      Be.a.c.custom = function(f, v) {
        return new O(v, f);
      }, Be.a.c.fontdeck = function(f, v) {
        return new De(v, f);
      }, Be.a.c.monotype = function(f, v) {
        return new k(v, f);
      }, Be.a.c.typekit = function(f, v) {
        return new pe(v, f);
      }, Be.a.c.google = function(f, v) {
        return new ue(v, f);
      };
      var qe = { load: s(Be.load, Be) };
      t.exports ? t.exports = qe : (window.WebFont = qe, window.WebFontConfig && Be.load(window.WebFontConfig));
    })();
  }(yi)), yi.exports;
}
var Np = Pp();
const Fp = /* @__PURE__ */ Op(Np), qa = [
  "Space Grotesk:400,500,600,700",
  "Instrument Sans:400,500,600",
  "JetBrains Mono:400,500,600"
], Mp = (t) => {
  const e = [...qa], n = (t == null ? void 0 : t.split(",")[0].trim().replace(/['"]/g, "")) || "", s = qa.some(
    (r) => r.toLowerCase().startsWith(n.toLowerCase())
  );
  n && !s && e.push(n), Fp.load({
    google: { families: e },
    active: () => {
      if (!t) return;
      const r = document.querySelector(".chat-container");
      r && (r.style.fontFamily = t.includes(",") ? t : `"${t}", system-ui, sans-serif`);
    }
  });
};
function Dp() {
  const t = ce({}), e = ce(""), n = (r) => {
    t.value = r, r.photo_url && (t.value.photo_url = r.photo_url), Mp(r.font_family), window.parent.postMessage({
      type: "CUSTOMIZATION_UPDATE",
      data: {
        chat_bubble_color: r.chat_bubble_color || "#C9F24E",
        chat_style: r.chat_style,
        chat_initiation_messages: r.chat_initiation_messages || []
      }
    }, "*");
  };
  return {
    customization: t,
    agentName: e,
    applyCustomization: n,
    initializeFromData: () => {
      const r = window.__INITIAL_DATA__;
      r && (n(r.customization || {}), e.value = r.agentName || "");
    }
  };
}
const Bp = 13, $p = 24;
function Up(t, e) {
  const n = Dr({}), s = [];
  let r = null;
  const i = typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, o = (c) => {
    r || s.length === 0 || (r = setTimeout(a, c));
  }, a = () => {
    r = null;
    const c = s[0];
    if (c === void 0) return;
    const b = t.value[c], m = n[c], P = (b == null ? void 0 : b.message) ?? "";
    if (!m || !b) {
      s.shift(), o(0);
      return;
    }
    if (m.shown >= P.length) {
      m.done = !0, s.shift(), o(0);
      return;
    }
    m.shown += 1;
    const $ = P[m.shown - 1];
    e == null || e(), o($ === " " ? $p : Bp);
  };
  pn(() => t.value.length, (c, b) => {
    b !== void 0 && c < b && (Object.keys(n).forEach((m) => {
      delete n[Number(m)];
    }), s.length = 0);
    for (let m = b ?? 0; m < c; m++) {
      const P = t.value[m];
      if (!P || !P.stream || m in n) continue;
      const $ = P.message ?? "";
      i || !$ ? n[m] = { shown: $.length, done: !0 } : (n[m] = { shown: 0, done: !1 }, s.push(m));
    }
    o(0);
  });
  const l = (c, b) => {
    const m = n[c];
    return m ? b.slice(0, m.shown) : b;
  }, h = (c) => {
    const b = n[c];
    return !!b && !b.done;
  };
  return Vs(() => {
    r && clearTimeout(r);
  }), { displayText: l, isStreaming: h };
}
function zp(t) {
  const e = ce(!0);
  let n = 0;
  const s = () => {
    window.parent.postMessage({ type: "UNREAD_COUNT", count: n }, "*");
  }, r = (i) => {
    var o;
    ((o = i == null ? void 0 : i.data) == null ? void 0 : o.type) === "WIDGET_VISIBILITY" && (e.value = !!i.data.open, e.value && n !== 0 && (n = 0, s()));
  };
  pn(() => t.value.length, (i, o) => {
    if (i <= (o ?? 0) || e.value) return;
    const a = t.value[i - 1];
    a && (a.message_type === "bot" || a.message_type === "agent") && (n += 1, s());
  }), so(() => window.addEventListener("message", r)), Vs(() => window.removeEventListener("message", r));
}
const Hp = {
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
}, qp = {
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
}, Wp = {
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
}, jp = {
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
}, Vp = {
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
}, br = {
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
}, Kp = {
  GLASS: Hp,
  AURORA: qp,
  TERMINAL: Wp,
  CALM_MINT: jp,
  PLAYFUL: Vp,
  SUNRISE: br,
  CHATBOT: br,
  ASK_ANYTHING: br
}, Gp = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", Wa = "'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
function Yp(t) {
  return Math.max(4, Math.round(t * 0.3));
}
function ja(t) {
  const e = (t || "").replace("#", "");
  if (e.length < 6) return "#0B0C10";
  const n = parseInt(e.slice(0, 2), 16), s = parseInt(e.slice(2, 4), 16), r = parseInt(e.slice(4, 6), 16);
  return (0.299 * n + 0.587 * s + 0.114 * r) / 255 > 0.62 ? "#0B0C10" : "#FFFFFF";
}
function Xp(t) {
  return Kp[t || ""] || br;
}
const Zp = "#212529";
function Jp(t, e) {
  const n = Xp(t), s = (e == null ? void 0 : e.chat_background_color) || "", r = /^#[0-9a-fA-F]{6}$/.test(s), i = s || n.card, o = (e == null ? void 0 : e.chat_text_color) || "", l = /^#[0-9a-fA-F]{6}$/.test(o) && o.toLowerCase() !== Zp ? o : r ? ns(s) ? "#FFFFFF" : "#111111" : n.text, h = r ? ns(s) ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)" : n.muted, c = r ? xh(s, 20) : n.agentBg, b = (e == null ? void 0 : e.accent_color) || n.accent, m = r ? !ns(s) : n.light, P = ja(b) === "#0B0C10", $ = m === P ? h : b, j = n.mono ? Gp : e != null && e.font_family ? `${e.font_family}, ${Wa}` : Wa;
  return {
    "--cm-card": i,
    "--cm-text": l,
    "--cm-muted": h,
    "--cm-agent-bg": c,
    "--cm-accent": b,
    "--cm-on-accent": ja(b),
    "--cm-presence": $,
    "--cm-border": n.border,
    "--cm-glow": n.glow,
    "--cm-radius": `${n.radius}px`,
    "--cm-bubble": `${n.bubble}px`,
    "--cm-bubble-tail": `${Yp(n.bubble)}px`,
    "--cm-field-radius": n.mono ? "7px" : "12px",
    "--cm-avatar-radius": n.mono ? "28%" : "50%",
    "--cm-hairline": n.light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)",
    "--cm-body-font": j
  };
}
function Qp() {
  const t = {
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
    formatCurrency: (s, r) => {
      if (!s && s !== 0) return "";
      const i = r ? t[r] || r : "", o = typeof s == "string" ? s : s.toString();
      return i ? `${i}${o}` : o;
    },
    getCurrencySymbol: (s) => t[s] || s,
    currencySymbols: t
  };
}
const eg = {
  key: 0,
  class: "widget-unavailable-overlay"
}, tg = {
  key: 1,
  class: "auth-error-overlay"
}, ng = { class: "auth-error-card" }, sg = { class: "auth-error-message" }, rg = {
  key: 0,
  class: "initializing-overlay"
}, ig = {
  key: 0,
  class: "connecting-message"
}, og = {
  key: 1,
  class: "failed-message"
}, ag = { class: "welcome-content" }, lg = { class: "welcome-header" }, cg = ["src", "alt"], ug = { class: "welcome-title" }, fg = { class: "welcome-subtitle" }, hg = { class: "welcome-input-container" }, dg = {
  key: 0,
  class: "email-input"
}, pg = ["disabled"], gg = { class: "welcome-message-input" }, mg = ["placeholder", "disabled"], _g = ["disabled"], yg = {
  key: 0,
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, vg = {
  key: 1,
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, bg = { class: "landing-page-content" }, wg = { class: "landing-page-header" }, kg = { class: "landing-page-heading" }, xg = { class: "landing-page-text" }, Ag = { class: "landing-page-actions" }, Tg = { class: "form-fullscreen-content" }, Sg = {
  key: 0,
  class: "form-header"
}, Eg = {
  key: 0,
  class: "form-title"
}, Cg = {
  key: 1,
  class: "form-description"
}, Rg = { class: "form-fields" }, Ig = ["for"], Lg = {
  key: 0,
  class: "required-indicator"
}, Og = ["id", "type", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "onBlur", "autocomplete", "inputmode"], Pg = ["id", "placeholder", "required", "min", "max", "value", "onInput"], Ng = ["id", "placeholder", "required", "minlength", "maxlength", "value", "onInput"], Fg = ["id", "required", "value", "onChange"], Mg = { value: "" }, Dg = ["value"], Bg = {
  key: 4,
  class: "checkbox-field"
}, $g = ["id", "required", "checked", "onChange"], Ug = { class: "checkbox-label" }, zg = {
  key: 5,
  class: "radio-group"
}, Hg = ["name", "value", "required", "checked", "onChange"], qg = { class: "radio-label" }, Wg = {
  key: 6,
  class: "field-error"
}, jg = { class: "form-actions" }, Vg = ["disabled"], Kg = {
  key: 0,
  class: "loading-spinner-inline"
}, Gg = { key: 1 }, Yg = { class: "header-content" }, Xg = ["src", "alt"], Zg = { class: "header-info" }, Jg = { class: "ask-anything-header" }, Qg = ["src", "alt"], em = { class: "header-info" }, tm = {
  key: 2,
  class: "loading-history"
}, nm = { class: "cm-email-gate-title" }, sm = ["disabled"], rm = {
  key: 0,
  class: "cm-email-gate-error"
}, im = ["disabled"], om = {
  key: 0,
  class: "cm-welcome-block"
}, am = { class: "message agent-message cm-welcome-row" }, lm = ["src", "alt"], cm = {
  key: 0,
  class: "cm-msg-avatar",
  "aria-hidden": "true"
}, um = ["src"], fm = ["src"], hm = { class: "message-col" }, dm = {
  key: 0,
  class: "rating-content"
}, pm = { class: "rating-prompt" }, gm = ["onMouseover", "onMouseleave", "onClick", "disabled"], mm = {
  key: 0,
  class: "feedback-wrapper"
}, _m = { class: "feedback-section" }, ym = ["onUpdate:modelValue", "disabled"], vm = { class: "feedback-counter" }, bm = ["onClick", "disabled"], wm = {
  key: 1,
  class: "submitted-feedback-wrapper"
}, km = { class: "submitted-feedback" }, xm = { class: "submitted-feedback-text" }, Am = {
  key: 2,
  class: "submitted-message"
}, Tm = {
  key: 1,
  class: "form-content"
}, Sm = {
  key: 0,
  class: "form-header"
}, Em = {
  key: 0,
  class: "form-title"
}, Cm = {
  key: 1,
  class: "form-description"
}, Rm = { class: "form-fields" }, Im = ["for"], Lm = {
  key: 0,
  class: "required-indicator"
}, Om = ["id", "type", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "onBlur", "disabled", "autocomplete", "inputmode"], Pm = ["id", "placeholder", "required", "min", "max", "value", "onInput", "disabled"], Nm = ["id", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "disabled"], Fm = ["id", "required", "value", "onChange", "disabled"], Mm = { value: "" }, Dm = ["value"], Bm = {
  key: 4,
  class: "checkbox-field"
}, $m = ["id", "checked", "onChange", "disabled"], Um = ["for"], zm = {
  key: 5,
  class: "radio-field"
}, Hm = ["id", "name", "value", "checked", "onChange", "disabled"], qm = ["for"], Wm = {
  key: 6,
  class: "field-error"
}, jm = { class: "form-actions" }, Vm = ["onClick", "disabled"], Km = {
  key: 2,
  class: "user-input-content"
}, Gm = {
  key: 0,
  class: "user-input-prompt"
}, Ym = {
  key: 1,
  class: "user-input-form"
}, Xm = ["onUpdate:modelValue", "onKeydown"], Zm = ["onClick", "disabled"], Jm = {
  key: 2,
  class: "user-input-submitted"
}, Qm = {
  key: 0,
  class: "user-input-confirmation"
}, e_ = {
  key: 3,
  class: "product-message-container"
}, t_ = ["innerHTML"], n_ = {
  key: 1,
  class: "products-carousel"
}, s_ = { class: "carousel-items" }, r_ = {
  key: 0,
  class: "product-image-compact"
}, i_ = ["src", "alt"], o_ = { class: "product-info-compact" }, a_ = { class: "product-text-area" }, l_ = { class: "product-title-compact" }, c_ = {
  key: 0,
  class: "product-variant-compact"
}, u_ = { class: "product-price-compact" }, f_ = { class: "product-actions-compact" }, h_ = ["onClick"], d_ = {
  key: 2,
  class: "no-products-message"
}, p_ = {
  key: 3,
  class: "no-products-message"
}, g_ = ["innerHTML"], m_ = ["innerHTML"], __ = {
  key: 2,
  class: "message-attachments"
}, y_ = {
  key: 0,
  class: "attachment-image-container"
}, v_ = ["src", "alt", "onClick"], b_ = { class: "attachment-image-info" }, w_ = ["href"], k_ = { class: "attachment-size" }, x_ = ["href"], A_ = { class: "attachment-size" }, T_ = {
  key: 0,
  class: "citation-chips"
}, S_ = ["title"], E_ = { class: "message-info" }, C_ = {
  key: 0,
  class: "agent-name"
}, R_ = {
  key: 4,
  class: "cm-quick-actions-bar"
}, I_ = ["disabled", "onClick"], L_ = {
  key: 0,
  class: "file-previews-widget"
}, O_ = {
  class: "file-preview-content-widget",
  style: { cursor: "pointer" }
}, P_ = ["src", "alt", "onClick"], N_ = ["onClick"], F_ = { class: "file-preview-info-widget" }, M_ = { class: "file-preview-name-widget" }, D_ = { class: "file-preview-size-widget" }, B_ = ["onClick"], $_ = {
  key: 1,
  class: "upload-progress-widget"
}, U_ = { class: "message-input" }, z_ = ["placeholder", "disabled"], H_ = ["disabled", "title"], q_ = ["disabled"], W_ = {
  key: 6,
  class: "new-conversation-section"
}, j_ = { class: "conversation-ended-message" }, V_ = {
  key: 7,
  class: "rating-dialog"
}, K_ = { class: "rating-content" }, G_ = { class: "star-rating" }, Y_ = ["onClick"], X_ = { class: "rating-actions" }, Z_ = ["disabled"], J_ = {
  key: 0,
  class: "preview-modal-image-container"
}, Q_ = ["src", "alt"], ey = { class: "preview-modal-filename" }, ty = {
  key: 3,
  class: "widget-loading"
}, Es = "ctid", Va = 3, ny = "image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls", sy = /* @__PURE__ */ ju({
  __name: "WidgetBuilder",
  props: {
    widgetId: {},
    token: {},
    initialAuthError: {}
  },
  setup(t) {
    var No;
    Ne.setOptions({
      renderer: new Ne.Renderer(),
      gfm: !0,
      breaks: !0
    });
    const e = new Ne.Renderer(), n = e.link;
    e.link = (d, g, u) => n.call(e, d, g, u).replace(/^<a /, '<a target="_blank" rel="nofollow" '), Ne.use({ renderer: e });
    const s = (d) => {
      const g = Ne(d, { renderer: e });
      return Cd(g);
    }, r = t, i = Ce(() => {
      var d;
      return r.widgetId || ((d = window.__INITIAL_DATA__) == null ? void 0 : d.widgetId);
    }), {
      customization: o,
      agentName: a,
      applyCustomization: l,
      initializeFromData: h
    } = Dp(), { formatCurrency: c } = Qp(), {
      messages: b,
      loading: m,
      errorMessage: P,
      showError: $,
      loadingHistory: j,
      hasStartedChat: Le,
      connectionStatus: te,
      sendMessage: Re,
      loadChatHistory: xe,
      connect: z,
      reconnect: W,
      cleanup: ne,
      humanAgent: V,
      onTakeover: Fe,
      submitRating: it,
      submitForm: Ve,
      currentForm: Te,
      getWorkflowState: me,
      proceedWorkflow: Ke,
      onWorkflowState: Je,
      onWorkflowProceeded: ct,
      currentSessionId: ae,
      setToken: _e,
      setWidgetId: le
    } = Lp(), { displayText: ft, isStreaming: ot } = Up(b, () => Si(() => Ot()));
    zp(b);
    const ie = ce(""), nt = ce(!0), ve = ce(""), q = ce(!1), de = (d) => {
      const g = d.target;
      ie.value = g.value;
    };
    let se = null;
    const Ie = () => {
      se && se.disconnect(), se = new MutationObserver((g) => {
        let u = !1, J = !1;
        g.forEach((we) => {
          if (we.type === "childList") {
            const fe = Array.from(we.addedNodes).some(
              (ke) => {
                var jt;
                return ke.nodeType === Node.ELEMENT_NODE && (ke.matches("input, textarea") || ((jt = ke.querySelector) == null ? void 0 : jt.call(ke, "input, textarea")));
              }
            ), je = Array.from(we.removedNodes).some(
              (ke) => {
                var jt;
                return ke.nodeType === Node.ELEMENT_NODE && (ke.matches("input, textarea") || ((jt = ke.querySelector) == null ? void 0 : jt.call(ke, "input, textarea")));
              }
            );
            fe && (J = !0, u = !0), je && (u = !0);
          }
        }), u && (clearTimeout(Ie.timeoutId), Ie.timeoutId = setTimeout(() => {
          Qe();
        }, J ? 50 : 100));
      });
      const d = document.querySelector(".widget-container") || document.body;
      se.observe(d, {
        childList: !0,
        subtree: !0
      });
    };
    Ie.timeoutId = null;
    let K = [];
    const Qe = () => {
      ut();
      const d = [
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
      for (const u of d) {
        const J = document.querySelectorAll(u);
        if (J.length > 0) {
          g = Array.from(J);
          break;
        }
      }
      g.length !== 0 && (K = g, g.forEach((u) => {
        u.addEventListener("input", p, !0), u.addEventListener("keyup", p, !0), u.addEventListener("change", p, !0), u.addEventListener("keypress", y, !0), u.addEventListener("keydown", k, !0);
      }));
    }, ut = () => {
      K.forEach((d) => {
        d.removeEventListener("input", p), d.removeEventListener("keyup", p), d.removeEventListener("change", p), d.removeEventListener("keypress", y), d.removeEventListener("keydown", k);
      }), K = [];
    }, vt = (d) => !!(d && d.closest && d.closest(".form-message, .form-fullscreen, .cm-email-gate")), p = (d) => {
      if (vt(d.target)) return;
      const g = d.target;
      ie.value = g.value;
    }, y = (d) => {
      vt(d.target) || d.key === "Enter" && !d.shiftKey && (d.preventDefault(), d.stopPropagation(), mt());
    }, k = (d) => {
      vt(d.target) || d.key === "Enter" && !d.shiftKey && (d.preventDefault(), d.stopPropagation(), mt());
    }, O = (d) => {
      const g = d.target, u = document.querySelector(".header-menu-container");
      document.querySelector(".header-menu-btn");
      const J = document.querySelector(".header-dropdown-menu");
      J && !(u != null && u.contains(g)) && (J.style.display = "none");
    }, R = ce(!0), L = (d) => !d || d === "undefined" || d === "null" || typeof d == "string" && d.trim() === "" ? null : d, B = ce(L(((No = window.__INITIAL_DATA__) == null ? void 0 : No.initialToken) || localStorage.getItem(Es)));
    Ce(() => !!B.value);
    const D = ce(null), M = ce(!1), N = ce(!1);
    r.initialAuthError && (D.value = r.initialAuthError, M.value = !0, R.value = !1), h();
    const X = window.__INITIAL_DATA__;
    if (X != null && X.initialToken) {
      const d = L(X.initialToken);
      d && (B.value = d, window.parent.postMessage({
        type: "TOKEN_UPDATE",
        token: d
      }, "*"), q.value = !0);
    }
    const U = ce(!1);
    (X == null ? void 0 : X.allowAttachments) !== void 0 && (U.value = X.allowAttachments);
    const G = ce(null), {
      chatStyles: Q,
      chatIconStyles: ue,
      agentBubbleStyles: Oe,
      userBubbleStyles: pe,
      messageNameStyles: De,
      headerBorderStyles: Be,
      photoUrl: qe,
      shadowStyle: f
    } = Fd(o), v = ce(null), {
      uploadedAttachments: A,
      previewModal: x,
      previewFile: F,
      formatFileSize: Y,
      isImageAttachment: ee,
      getDownloadUrl: be,
      getPreviewUrl: Se,
      handleFileSelect: Ge,
      handleDrop: Me,
      handleDragOver: dt,
      handleDragLeave: bt,
      handlePaste: We,
      removeAttachment: Xt,
      openPreview: is,
      closePreview: Pn,
      openFilePicker: qn,
      isImage: os
    } = Bd(B, v);
    Ce(() => b.value.some(
      (d) => d.message_type === "form" && (!d.isSubmitted || d.isSubmitted === !1)
    ));
    const qt = Ce(() => {
      var d;
      return Le.value && q.value || !Zr.value ? te.value === "connected" && !m.value : ys(ve.value.trim()) && te.value === "connected" && !m.value || ((d = window.__INITIAL_DATA__) == null ? void 0 : d.workflow);
    }), Ys = Ce(() => te.value === "connected" ? Wt.value ? "Ask me anything..." : "Type a message..." : "Connecting..."), mt = async () => {
      if (!ie.value.trim() && A.value.length === 0) return;
      !Le.value && ve.value && await an();
      const d = A.value.map((u) => ({
        content: u.content,
        // base64 content
        filename: u.filename,
        content_type: u.type,
        size: u.size
      }));
      await Re(ie.value, ve.value, d), A.value.forEach((u) => {
        u.url && u.url.startsWith("blob:") && URL.revokeObjectURL(u.url), u.file_url && u.file_url.startsWith("blob:") && URL.revokeObjectURL(u.file_url);
      }), ie.value = "", A.value = [];
      const g = document.querySelector('input[placeholder*="Type a message"]');
      g && (g.value = ""), setTimeout(() => {
        Qe();
      }, 500);
    }, bn = (d) => {
      qt.value && (ie.value = d, mt());
    }, Wn = () => {
      window.parent.postMessage({ type: "WIDGET_MINIMIZE" }, "*");
    }, as = (d) => {
      d.key === "Enter" && !d.shiftKey && (d.preventDefault(), d.stopPropagation(), mt());
    }, an = async () => {
      var d, g, u, J;
      try {
        if (!i.value)
          return console.error("Widget ID is not available"), D.value = "Widget ID is not available. Please refresh and try again.", M.value = !0, !1;
        const we = new URL(`${Ws.API_URL}/widgets/${i.value}`);
        ve.value.trim() && ys(ve.value.trim()) && we.searchParams.append("email", ve.value.trim());
        const fe = {
          Accept: "application/json",
          "Content-Type": "application/json"
        };
        B.value && (fe.Authorization = `Bearer ${B.value}`);
        const je = await fetch(we, {
          headers: fe
        });
        if (je.status === 401) {
          q.value = !1;
          try {
            const Vn = (await je.json()).detail || "";
            (Vn.includes("generate-token") || Vn.includes("API key") || Vn.includes("Token required")) && (N.value = !0, D.value = "Widget authentication not configured. Please contact the website administrator.", M.value = !0, localStorage.removeItem(Es), B.value = null);
          } catch {
            D.value = "Authentication required. Your token has expired or is invalid. Please refresh the page.", M.value = !0, localStorage.removeItem(Es), B.value = null;
          }
          return !1;
        }
        if (!je.ok) {
          try {
            const ps = await je.json();
            D.value = ps.detail || `Error: ${je.statusText}`;
          } catch {
            D.value = `Error: ${je.statusText}. Please try again.`;
          }
          return M.value = !0, !1;
        }
        const ke = await je.json();
        return ke.token && (B.value = ke.token, localStorage.setItem(Es, ke.token), window.parent.postMessage({ type: "TOKEN_UPDATE", token: ke.token }, "*")), q.value = !0, D.value = null, M.value = !1, _e(B.value || void 0), await z() ? (await Xs(), (d = ke.agent) != null && d.customization && l(ke.agent.customization), ke.agent && !(ke != null && ke.human_agent) && (a.value = ke.agent.name), ke != null && ke.human_agent && (V.value = ke.human_agent), ((g = ke.agent) == null ? void 0 : g.allow_attachments) !== void 0 && (U.value = ke.agent.allow_attachments), ((u = ke.agent) == null ? void 0 : u.workflow) !== void 0 && (window.__INITIAL_DATA__ = window.__INITIAL_DATA__ || {}, window.__INITIAL_DATA__.workflow = ke.agent.workflow), (J = ke.agent) != null && J.workflow && await me(), !0) : (console.error("Failed to connect to chat service"), D.value = "Failed to connect to chat service. Please try again.", M.value = !0, !1);
      } catch (we) {
        return console.error("Error checking authorization:", we), D.value = "An unexpected error occurred. Please try again.", M.value = !0, q.value = !1, !1;
      } finally {
        R.value = !1;
      }
    }, Xs = async () => {
      !Le.value && q.value && (Le.value = !0, await xe());
    }, Ot = () => {
      G.value && (G.value.scrollTop = G.value.scrollHeight);
    };
    pn(() => b.value, (d) => {
      Si(() => {
        Ot();
      });
    }, { deep: !0 }), pn(te, (d, g) => {
      d === "connected" && g !== "connected" && setTimeout(Qe, 100);
    }), pn(() => b.value.length, (d, g) => {
      d > 0 && g === 0 && setTimeout(Qe, 100);
    });
    let ls = null;
    pn(() => b.value, (d) => {
      const g = d[d.length - 1];
      !Fa(g) || g === ls || (ls = g, Js(g));
    }, { deep: !0 });
    const Zs = async () => {
      await W() && await an();
    }, cs = ce(!1), Nn = ce(0), us = ce(""), Z = ce(0), _ = ce(!1), I = ce({}), H = ce(!1), ge = ce({}), at = ce(!1), st = ce(null), _t = ce("Start Chat"), wt = ce(!1), ht = ce(null);
    Ce(() => {
      var g;
      const d = b.value[b.value.length - 1];
      return ((g = d == null ? void 0 : d.attributes) == null ? void 0 : g.request_rating) || !1;
    });
    const wn = Ce(() => {
      var g;
      if (!((g = window.__INITIAL_DATA__) != null && g.workflow))
        return !1;
      const d = b.value.find((u) => u.message_type === "rating");
      return (d == null ? void 0 : d.isSubmitted) === !0;
    }), rt = Ce(
      () => Lr(V.value.human_agent_profile_pic)
    ), Js = async (d) => {
      var g, u, J, we, fe;
      if (Fa(d)) {
        try {
          if (d.session_id && B.value && i.value) {
            const je = new URL(`${Ws.API_URL}/widgets/${i.value}/end-chat`);
            je.searchParams.append("session_id", d.session_id), (g = d.attributes) != null && g.end_chat_reason && je.searchParams.append("reason", d.attributes.end_chat_reason), (u = d.attributes) != null && u.end_chat_description && je.searchParams.append("description", d.attributes.end_chat_description);
            const ke = await fetch(je, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${B.value}`,
                "Content-Type": "application/json"
              }
            });
            if (ke.ok) {
              const jt = await ke.json();
              console.info(`✓ Chat session closed on backend: ${jt.session_id}`);
            } else
              console.warn(`Failed to close session on backend: ${ke.status}`);
          }
        } catch (je) {
          console.error("Error calling end-chat API:", je);
        }
        if ((J = d.attributes) != null && J.end_chat && ((we = d.attributes) != null && we.request_rating)) {
          const je = d.agent_name || ((fe = V.value) == null ? void 0 : fe.human_agent_name) || a.value || "our agent";
          b.value.push({
            message: `Rate the chat session that you had with ${je}`,
            message_type: "rating",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            session_id: d.session_id,
            agent_name: je,
            showFeedback: !1
          }), ae.value = d.session_id;
        }
      }
    }, Qs = (d) => {
      _.value || (Z.value = d);
    }, Cc = () => {
      if (!_.value) {
        const d = b.value[b.value.length - 1];
        Z.value = (d == null ? void 0 : d.selectedRating) || 0;
      }
    }, Rc = async (d) => {
      if (!_.value) {
        Z.value = d;
        const g = b.value[b.value.length - 1];
        g && g.message_type === "rating" && (g.showFeedback = !0, g.selectedRating = d);
      }
    }, Ic = async (d, g, u = null) => {
      try {
        _.value = !0, await it(g, u);
        const J = b.value.find((we) => we.message_type === "rating");
        J && (J.isSubmitted = !0, J.finalRating = g, J.finalFeedback = u);
      } catch (J) {
        console.error("Failed to submit rating:", J);
      } finally {
        _.value = !1;
      }
    }, Lc = (d) => {
      const g = {};
      for (const u of d.fields) {
        const J = I.value[u.name], we = Kr(u, J);
        we && (g[u.name] = we);
      }
      return ge.value = g, Object.keys(g).length === 0;
    }, Oc = async (d) => {
      if (!(H.value || !Lc(d)))
        try {
          H.value = !0, await Ve(I.value);
          const u = b.value.findIndex(
            (J) => J.message_type === "form" && (!J.isSubmitted || J.isSubmitted === !1)
          );
          u !== -1 && b.value.splice(u, 1), I.value = {}, ge.value = {};
        } catch (u) {
          console.error("Failed to submit form:", u);
        } finally {
          H.value = !1;
        }
    }, Pt = (d, g) => {
      var u, J;
      if (I.value[d] = g, g && g.toString().trim() !== "") {
        let we = null;
        if ((u = ht.value) != null && u.fields && (we = ht.value.fields.find((fe) => fe.name === d)), !we && ((J = Te.value) != null && J.fields) && (we = Te.value.fields.find((fe) => fe.name === d)), we) {
          const fe = Kr(we, g);
          fe ? (ge.value[d] = fe, console.log(`Validation error for ${d}:`, fe)) : delete ge.value[d];
        }
      } else
        delete ge.value[d], console.log(`Cleared error for ${d}`);
    }, Pc = (d) => {
      const g = d.replace(/\D/g, "");
      return g.length >= 7 && g.length <= 15;
    }, Kr = (d, g) => {
      if (d.required && (!g || g.toString().trim() === ""))
        return `${d.label} is required`;
      if (!g || g.toString().trim() === "")
        return null;
      if (d.type === "email" && !ys(g))
        return "Please enter a valid email address";
      if (d.type === "tel" && !Pc(g))
        return "Please enter a valid phone number";
      if ((d.type === "text" || d.type === "textarea") && d.minLength && g.length < d.minLength)
        return `${d.label} must be at least ${d.minLength} characters`;
      if ((d.type === "text" || d.type === "textarea") && d.maxLength && g.length > d.maxLength)
        return `${d.label} must not exceed ${d.maxLength} characters`;
      if (d.type === "number") {
        const u = parseFloat(g);
        if (isNaN(u))
          return `${d.label} must be a valid number`;
        if (d.minLength && u < d.minLength)
          return `${d.label} must be at least ${d.minLength}`;
        if (d.maxLength && u > d.maxLength)
          return `${d.label} must not exceed ${d.maxLength}`;
      }
      return null;
    }, Nc = async () => {
      if (!(H.value || !ht.value))
        try {
          H.value = !0, ge.value = {};
          let d = !1;
          for (const g of ht.value.fields || []) {
            const u = I.value[g.name], J = Kr(g, u);
            J && (ge.value[g.name] = J, d = !0, console.log(`Validation error for field ${g.name}:`, J));
          }
          if (d) {
            H.value = !1, console.log("Validation failed, not submitting");
            return;
          }
          await Ve(I.value), wt.value = !1, ht.value = null, I.value = {};
        } catch (d) {
          console.error("Failed to submit full screen form:", d);
        } finally {
          H.value = !1, console.log("Full screen form submission completed");
        }
    }, Fc = (d, g) => {
      if (console.log("handleViewDetails called with:", { product: d, shopDomain: g }), !d) {
        console.error("No product provided to handleViewDetails");
        return;
      }
      let u = null;
      if (d.handle && g)
        u = `https://${g}/products/${d.handle}`;
      else if (d.id && g)
        u = `https://${g}/products/${d.id}`;
      else if (g) {
        if (!d.handle && !d.id) {
          console.error("Product handle and ID are both missing! Product:", d), alert("Unable to open product: Product information incomplete.");
          return;
        }
      } else {
        console.error("Shop domain is missing! Product:", d), alert("Unable to open product: Shop domain not available. Please contact support.");
        return;
      }
      u && (console.log("Opening product URL:", u), window.open(u, "_blank"));
    }, Mc = (d) => {
      if (!d) return "";
      let g = d.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "");
      const u = [];
      return g = g.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (J, we, fe) => {
        const je = `__MARKDOWN_LINK_${u.length}__`;
        return console.log("Found markdown link:", J, "-> placeholder:", je), u.push(J), je;
      }), console.log("After replacing markdown links with placeholders:", g), console.log("Markdown links array:", u), g = g.replace(/https?:\/\/[^\s\)]+/g, "[link removed]"), console.log("After removing standalone URLs:", g), u.forEach((J, we) => {
        g = g.replace(`__MARKDOWN_LINK_${we}__`, J), console.log(`Restored markdown link ${we}:`, J);
      }), g = g.replace(/\n\s*\n\s*\n/g, `

`).trim(), g;
    }, xo = ce(!1);
    ce(!1);
    const Ao = Ce(() => {
      var d;
      return !!((d = V.value) != null && d.human_agent_name);
    }), Dc = Ce(() => U.value && Ao.value && A.value.length < Va), Bc = async () => {
      try {
        at.value = !1, st.value = null, await Ke();
      } catch (d) {
        console.error("Failed to proceed workflow:", d);
      }
    }, Gr = async (d) => {
      try {
        if (!d.userInputValue || !d.userInputValue.trim())
          return;
        const g = d.userInputValue.trim();
        d.isSubmitted = !0, d.submittedValue = g, await Re(g, ve.value);
      } catch (g) {
        console.error("Failed to submit user input:", g), d.isSubmitted = !1, d.submittedValue = null;
      }
    }, To = async () => {
      var d, g, u;
      try {
        let J = 0;
        const we = 50;
        for (; !((d = window.__INITIAL_DATA__) != null && d.widgetId) && J < we; )
          await new Promise((je) => setTimeout(je, 100)), J++;
        return (g = window.__INITIAL_DATA__) != null && g.widgetId ? (le(window.__INITIAL_DATA__.widgetId), await an() ? ((u = window.__INITIAL_DATA__) != null && u.workflow && q.value && await me(), !0) : (te.value = "connected", !1)) : (console.error("Widget data not available after waiting"), !1);
      } catch (J) {
        return console.error("Failed to initialize widget:", J), !1;
      }
    }, $c = () => {
      Fe(async () => {
        await an();
      }), window.addEventListener("message", (d) => {
        d.data.type === "SCROLL_TO_BOTTOM" && Ot(), d.data.type === "TOKEN_RECEIVED" && localStorage.setItem(Es, d.data.token);
      }), Je((d) => {
        var g;
        if (_t.value = d.button_text || "Start Chat", d.type === "landing_page")
          st.value = d.landing_page_data, at.value = !0, wt.value = !1;
        else if (d.type === "form" || d.type === "display_form")
          if (((g = d.form_data) == null ? void 0 : g.form_full_screen) === !0)
            ht.value = d.form_data, wt.value = !0, at.value = !1;
          else {
            const u = {
              message: "",
              message_type: "form",
              attributes: {
                form_data: d.form_data
              },
              created_at: (/* @__PURE__ */ new Date()).toISOString(),
              isSubmitted: !1
            };
            b.value.findIndex(
              (we) => we.message_type === "form" && !we.isSubmitted
            ) === -1 && b.value.push(u), at.value = !1, wt.value = !1;
          }
        else
          at.value = !1, wt.value = !1;
      }), ct((d) => {
        console.log("Workflow proceeded:", d);
      });
    }, Uc = async () => {
      try {
        await To(), await me();
      } catch (d) {
        throw console.error("Failed to start new conversation:", d), d;
      }
    }, zc = async () => {
      wn.value = !1, b.value = [], V.value = {}, await Uc();
    };
    so(async () => {
      await To(), $c(), Ie(), document.addEventListener("click", O), (() => {
        const g = b.value.length > 0, u = te.value === "connected", J = document.querySelector('input[type="text"], textarea') !== null;
        return g || u || J;
      })() && setTimeout(Qe, 100);
    }), Vs(() => {
      window.removeEventListener("message", (d) => {
        d.data.type === "SCROLL_TO_BOTTOM" && Ot();
      }), document.removeEventListener("click", O), se && (se.disconnect(), se = null), Ie.timeoutId && (clearTimeout(Ie.timeoutId), Ie.timeoutId = null), ut(), ne();
    });
    const jn = Ce(() => o.value.chat_style === "AURORA"), Wt = Ce(() => o.value.chat_style === "ASK_ANYTHING" || jn.value), So = Ce(() => o.value.customization_metadata), er = Ce(() => {
      var g;
      const d = (g = So.value) == null ? void 0 : g.avatar_style;
      return d === "orb" ? !0 : d === "photo" ? !1 : jn.value && !o.value.photo_url;
    }), fs = Ce(() => {
      var d;
      return Ld(a.value || "", (d = So.value) == null ? void 0 : d.orb_variant);
    }), Hc = {
      GLASS: "theme-glass",
      TERMINAL: "theme-terminal",
      PLAYFUL: "theme-playful",
      CALM_MINT: "theme-calm",
      SUNRISE: "theme-sunrise"
    }, qc = Ce(() => Hc[o.value.chat_style] || ""), Wc = Ce(() => Jp(o.value.chat_style, {
      chat_background_color: o.value.chat_background_color,
      chat_text_color: o.value.chat_text_color,
      accent_color: o.value.accent_color,
      font_family: o.value.font_family
    })), Eo = Ce(
      () => Array.isArray(o.value.quick_actions) ? o.value.quick_actions.filter((d) => !!d && d.trim().length > 0) : []
    ), Co = Ce(() => (o.value.welcome_message || "").trim()), Ro = Ce(
      () => !Wt.value && b.value.length === 0 && !j.value && !ds.value
    ), jc = Ce(
      () => Ro.value && Co.value.length > 0
    ), Vc = Ce(
      () => Ro.value && !wn.value && Eo.value.length > 0
    ), Yr = Ce(() => o.value.show_citations === !0), Kc = Ce(() => Pd(o.value.show_ai_disclaimer, Ao.value)), Gc = (d) => /^[0-9a-f]{16,}$/i.test(d) || /^[0-9a-f-]{32,}$/i.test(d), Xr = (d) => {
      const g = (d || "").trim().toLowerCase();
      return !g || g === "unknown" ? "Knowledge base" : g.charAt(0).toUpperCase() + g.slice(1);
    }, Io = (d) => {
      let g = ((d == null ? void 0 : d.name) || "").trim();
      return !g || (g = g.replace(/^[0-9a-f]{16,}[_-]/i, "").replace(/\.(pdf|txt|md|html?|docx?|csv|json)$/i, ""), !g || Gc(g)) ? Xr(d == null ? void 0 : d.type) : g;
    }, Yc = (d) => {
      const g = Io(d), u = Xr(d == null ? void 0 : d.type);
      return g === u ? u : `${g} · ${u}`;
    }, Zr = Ce(() => o.value.collect_email === !0 && !Wt.value), Lo = ce(!1), kn = ce(""), hs = ce(!1), ds = Ce(() => !Le.value && Zr.value && !Lo.value), Oo = async () => {
      const d = ve.value.trim();
      if (!d) {
        kn.value = "Please enter your email address.";
        return;
      }
      if (!ys(d)) {
        kn.value = "Please enter a valid email address.";
        return;
      }
      kn.value = "", hs.value = !0;
      try {
        await an(), Lo.value = !0;
      } catch {
        kn.value = "Something went wrong. Please try again.";
      } finally {
        hs.value = !1;
      }
    }, Xc = Ce(() => {
      const d = {
        width: "100%",
        height: "100%",
        borderRadius: "var(--radius-lg)"
      };
      return Wt.value ? window.innerWidth <= 768 ? {
        ...d,
        width: "100vw",
        height: "100vh",
        maxWidth: "100vw",
        maxHeight: "100vh",
        minWidth: "unset",
        borderRadius: "0"
      } : window.innerWidth <= 1024 ? {
        ...d,
        width: "95%",
        maxWidth: "700px",
        minWidth: "500px",
        height: "650px"
      } : {
        ...d,
        width: "100%",
        maxWidth: "400px",
        minWidth: "400px",
        height: "580px"
      } : d;
    }), Po = Ce(() => Wt.value && b.value.length === 0);
    return (d, g) => M.value && N.value ? (T(), S("div", eg, [
      w("button", {
        type: "button",
        class: "cm-error-close",
        "aria-label": "Close chat",
        title: "Close",
        onClick: Wn
      }, "×"),
      g[19] || (g[19] = Dn('<div class="widget-unavailable-card" data-v-f87cdb68><div class="widget-unavailable-icon-wrapper" data-v-f87cdb68><svg class="widget-unavailable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-f87cdb68><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" data-v-f87cdb68></path><path d="M9 12l2 2 4-4" data-v-f87cdb68></path></svg></div><h2 class="widget-unavailable-title" data-v-f87cdb68>Chat Unavailable</h2><p class="widget-unavailable-message" data-v-f87cdb68> This chat widget is not currently configured. Please contact the website administrator to enable chat support. </p><div class="widget-unavailable-footer" data-v-f87cdb68><svg class="chattermate-logo-small" width="14" height="14" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-f87cdb68><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-f87cdb68></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-f87cdb68><span class="cm-powered-prefix" data-v-f87cdb68>Powered by </span><strong class="cm-brand" data-v-f87cdb68>ChatterMate</strong></a></div></div>', 1))
    ])) : M.value ? (T(), S("div", tg, [
      w("button", {
        type: "button",
        class: "cm-error-close",
        "aria-label": "Close chat",
        title: "Close",
        onClick: Wn
      }, "×"),
      w("div", ng, [
        g[20] || (g[20] = Dn('<div class="auth-error-header" data-v-f87cdb68><svg class="auth-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-f87cdb68><circle cx="12" cy="12" r="10" data-v-f87cdb68></circle><line x1="12" y1="8" x2="12" y2="12" data-v-f87cdb68></line><line x1="12" y1="16" x2="12.01" y2="16" data-v-f87cdb68></line></svg><h2 data-v-f87cdb68>Authentication Error</h2></div>', 1)),
        w("p", sg, re(D.value), 1),
        w("button", {
          class: "auth-error-refresh-btn",
          onClick: g[0] || (g[0] = () => d.window.location.reload())
        }, " Refresh Page ")
      ])
    ])) : i.value && !M.value ? (T(), S("div", {
      key: 2,
      class: Xe(["chat-container cm-surface", [{ collapsed: !nt.value, "ask-anything-style": Wt.value, aurora: jn.value }, qc.value]]),
      style: Ae({ ...E(f), ...Xc.value, ...Wc.value })
    }, [
      R.value ? (T(), S("div", rg, g[21] || (g[21] = [
        Dn('<div class="loading-spinner" data-v-f87cdb68><div class="dot" data-v-f87cdb68></div><div class="dot" data-v-f87cdb68></div><div class="dot" data-v-f87cdb68></div></div><div class="loading-text" data-v-f87cdb68>Initializing chat...</div>', 2)
      ]))) : oe("", !0),
      !R.value && E(te) !== "connected" ? (T(), S("div", {
        key: 1,
        class: Xe(["connection-status", E(te)])
      }, [
        E(te) === "connecting" ? (T(), S("div", ig, g[22] || (g[22] = [
          cn(" Connecting to chat service... ", -1),
          w("div", { class: "loading-dots" }, [
            w("div", { class: "dot" }),
            w("div", { class: "dot" }),
            w("div", { class: "dot" })
          ], -1)
        ]))) : E(te) === "failed" ? (T(), S("div", og, [
          g[23] || (g[23] = cn(" Connection failed. ", -1)),
          w("button", {
            onClick: Zs,
            class: "reconnect-button"
          }, " Click here to reconnect ")
        ])) : oe("", !0)
      ], 2)) : oe("", !0),
      E($) ? (T(), S("div", {
        key: 2,
        class: "error-alert",
        style: Ae(E(ue))
      }, re(E(P)), 5)) : oe("", !0),
      Po.value ? (T(), S("div", {
        key: 3,
        class: Xe(["welcome-message-section", { aurora: jn.value }]),
        style: Ae(E(Q))
      }, [
        w("div", ag, [
          w("div", lg, [
            er.value ? (T(), S("div", {
              key: 0,
              class: "welcome-orb",
              style: Ae(fs.value)
            }, null, 4)) : E(qe) ? (T(), S("img", {
              key: 1,
              src: E(qe),
              alt: E(a),
              class: "welcome-avatar"
            }, null, 8, cg)) : oe("", !0),
            w("h1", ug, re(E(o).welcome_title || `Welcome to ${E(a)}`), 1),
            w("p", fg, re(E(o).welcome_subtitle || "I'm here to help you with anything you need. What can I assist you with today?"), 1)
          ])
        ]),
        w("div", hg, [
          !E(Le) && !q.value && Zr.value ? (T(), S("div", dg, [
            xn(w("input", {
              "onUpdate:modelValue": g[1] || (g[1] = (u) => ve.value = u),
              type: "email",
              placeholder: "Enter your email address",
              disabled: E(m) || E(te) !== "connected",
              class: Xe([{
                invalid: ve.value.trim() && !E(ys)(ve.value.trim()),
                disabled: E(te) !== "connected"
              }, "welcome-email-input"])
            }, null, 10, pg), [
              [Bn, ve.value]
            ])
          ])) : oe("", !0),
          w("div", gg, [
            xn(w("input", {
              "onUpdate:modelValue": g[2] || (g[2] = (u) => ie.value = u),
              type: "text",
              placeholder: Ys.value,
              onKeypress: as,
              onInput: de,
              onChange: de,
              disabled: !qt.value,
              class: Xe([{ disabled: !qt.value }, "welcome-message-field"])
            }, null, 42, mg), [
              [Bn, ie.value]
            ]),
            w("button", {
              class: Xe(["welcome-send-button", { "aurora-send": jn.value }]),
              style: Ae(E(pe)),
              onClick: mt,
              disabled: !ie.value.trim() || !qt.value
            }, [
              jn.value ? (T(), S("svg", yg, g[24] || (g[24] = [
                w("path", {
                  d: "M12 19V5M12 5L5 12M12 5L19 12",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, null, -1)
              ]))) : (T(), S("svg", vg, g[25] || (g[25] = [
                w("path", {
                  d: "M5 12L3 21L21 12L3 3L5 12ZM5 12L13 12",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, null, -1)
              ])))
            ], 14, _g)
          ])
        ]),
        w("div", {
          class: "powered-by-welcome",
          style: Ae(E(De))
        }, g[26] || (g[26] = [
          Dn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-f87cdb68><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-f87cdb68></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-f87cdb68><span class="cm-powered-prefix" data-v-f87cdb68>Powered by </span><strong class="cm-brand" data-v-f87cdb68>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 6)) : oe("", !0),
      at.value && st.value ? (T(), S("div", {
        key: 4,
        class: "landing-page-fullscreen",
        style: Ae(E(Q))
      }, [
        w("div", bg, [
          w("div", wg, [
            w("h2", kg, re(st.value.heading), 1),
            w("div", xg, re(st.value.content), 1)
          ]),
          w("div", Ag, [
            w("button", {
              class: "landing-page-button",
              onClick: Bc
            }, re(_t.value), 1)
          ])
        ]),
        w("div", {
          class: "powered-by-landing",
          style: Ae(E(De))
        }, g[27] || (g[27] = [
          Dn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-f87cdb68><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-f87cdb68></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-f87cdb68><span class="cm-powered-prefix" data-v-f87cdb68>Powered by </span><strong class="cm-brand" data-v-f87cdb68>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 4)) : wt.value && ht.value ? (T(), S("div", {
        key: 5,
        class: "form-fullscreen",
        style: Ae(E(Q))
      }, [
        w("div", Tg, [
          ht.value.title || ht.value.description ? (T(), S("div", Sg, [
            ht.value.title ? (T(), S("h2", Eg, re(ht.value.title), 1)) : oe("", !0),
            ht.value.description ? (T(), S("p", Cg, re(ht.value.description), 1)) : oe("", !0)
          ])) : oe("", !0),
          w("div", Rg, [
            (T(!0), S(et, null, Nt(ht.value.fields, (u) => {
              var J, we;
              return T(), S("div", {
                key: u.name,
                class: "form-field"
              }, [
                w("label", {
                  for: `fullscreen-form-${u.name}`,
                  class: "field-label"
                }, [
                  cn(re(u.label) + " ", 1),
                  u.required ? (T(), S("span", Lg, "*")) : oe("", !0)
                ], 8, Ig),
                u.type === "text" || u.type === "email" || u.type === "tel" ? (T(), S("input", {
                  key: 0,
                  id: `fullscreen-form-${u.name}`,
                  type: u.type,
                  placeholder: u.placeholder || "",
                  required: u.required,
                  minlength: u.minLength,
                  maxlength: u.maxLength,
                  value: I.value[u.name] || "",
                  onInput: (fe) => Pt(u.name, fe.target.value),
                  onBlur: (fe) => Pt(u.name, fe.target.value),
                  class: Xe(["form-input", { error: ge.value[u.name] }]),
                  autocomplete: u.type === "email" ? "email" : u.type === "tel" ? "tel" : "off",
                  inputmode: u.type === "tel" ? "tel" : u.type === "email" ? "email" : "text"
                }, null, 42, Og)) : u.type === "number" ? (T(), S("input", {
                  key: 1,
                  id: `fullscreen-form-${u.name}`,
                  type: "number",
                  placeholder: u.placeholder || "",
                  required: u.required,
                  min: u.minLength,
                  max: u.maxLength,
                  value: I.value[u.name] || "",
                  onInput: (fe) => Pt(u.name, fe.target.value),
                  class: Xe(["form-input", { error: ge.value[u.name] }])
                }, null, 42, Pg)) : u.type === "textarea" ? (T(), S("textarea", {
                  key: 2,
                  id: `fullscreen-form-${u.name}`,
                  placeholder: u.placeholder || "",
                  required: u.required,
                  minlength: u.minLength,
                  maxlength: u.maxLength,
                  value: I.value[u.name] || "",
                  onInput: (fe) => Pt(u.name, fe.target.value),
                  class: Xe(["form-textarea", { error: ge.value[u.name] }]),
                  rows: "4"
                }, null, 42, Ng)) : u.type === "select" ? (T(), S("select", {
                  key: 3,
                  id: `fullscreen-form-${u.name}`,
                  required: u.required,
                  value: I.value[u.name] || "",
                  onChange: (fe) => Pt(u.name, fe.target.value),
                  class: Xe(["form-select", { error: ge.value[u.name] }])
                }, [
                  w("option", Mg, re(u.placeholder || "Please select..."), 1),
                  (T(!0), S(et, null, Nt((Array.isArray(u.options) ? u.options : ((J = u.options) == null ? void 0 : J.split(`
`)) || []).filter((fe) => fe.trim()), (fe) => (T(), S("option", {
                    key: fe,
                    value: fe.trim()
                  }, re(fe.trim()), 9, Dg))), 128))
                ], 42, Fg)) : u.type === "checkbox" ? (T(), S("label", Bg, [
                  w("input", {
                    id: `fullscreen-form-${u.name}`,
                    type: "checkbox",
                    required: u.required,
                    checked: I.value[u.name] || !1,
                    onChange: (fe) => Pt(u.name, fe.target.checked),
                    class: "form-checkbox"
                  }, null, 40, $g),
                  w("span", Ug, re(u.label), 1)
                ])) : u.type === "radio" ? (T(), S("div", zg, [
                  (T(!0), S(et, null, Nt((Array.isArray(u.options) ? u.options : ((we = u.options) == null ? void 0 : we.split(`
`)) || []).filter((fe) => fe.trim()), (fe) => (T(), S("label", {
                    key: fe,
                    class: "radio-field"
                  }, [
                    w("input", {
                      type: "radio",
                      name: `fullscreen-form-${u.name}`,
                      value: fe.trim(),
                      required: u.required,
                      checked: I.value[u.name] === fe.trim(),
                      onChange: (je) => Pt(u.name, fe.trim()),
                      class: "form-radio"
                    }, null, 40, Hg),
                    w("span", qg, re(fe.trim()), 1)
                  ]))), 128))
                ])) : oe("", !0),
                ge.value[u.name] ? (T(), S("div", Wg, re(ge.value[u.name]), 1)) : oe("", !0)
              ]);
            }), 128))
          ]),
          w("div", jg, [
            w("button", {
              onClick: g[3] || (g[3] = () => {
                console.log("Submit button clicked!"), Nc();
              }),
              disabled: H.value,
              class: "submit-form-button",
              style: Ae(E(pe))
            }, [
              H.value ? (T(), S("span", Kg, g[28] || (g[28] = [
                w("div", { class: "dot" }, null, -1),
                w("div", { class: "dot" }, null, -1),
                w("div", { class: "dot" }, null, -1)
              ]))) : (T(), S("span", Gg, re(ht.value.submit_button_text || "Submit"), 1))
            ], 12, Vg)
          ])
        ]),
        w("div", {
          class: "powered-by-landing",
          style: Ae(E(De))
        }, g[29] || (g[29] = [
          Dn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-f87cdb68><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-f87cdb68></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-f87cdb68><span class="cm-powered-prefix" data-v-f87cdb68>Powered by </span><strong class="cm-brand" data-v-f87cdb68>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 4)) : Po.value ? oe("", !0) : (T(), S(et, { key: 6 }, [
        nt.value ? (T(), S("div", {
          key: 0,
          class: Xe(["chat-panel", { "ask-anything-chat": Wt.value }]),
          style: Ae(E(Q))
        }, [
          Wt.value ? (T(), S("div", {
            key: 1,
            class: "ask-anything-top",
            style: Ae(E(Be))
          }, [
            w("div", Jg, [
              rt.value || E(qe) ? (T(), S("img", {
                key: 0,
                src: rt.value || E(qe),
                alt: E(V).human_agent_name || E(a),
                class: "header-avatar"
              }, null, 8, Qg)) : oe("", !0),
              w("div", em, [
                w("h3", {
                  style: Ae(E(De))
                }, re(E(a)), 5),
                w("p", {
                  class: "ask-anything-subtitle",
                  style: Ae(E(De))
                }, re(E(o).welcome_subtitle || "Ask me anything. I'm here to help."), 5)
              ])
            ])
          ], 4)) : (T(), S("div", {
            key: 0,
            class: "chat-header",
            style: Ae(E(Be))
          }, [
            w("div", {
              class: "cm-header-sheen",
              style: Ae({ background: "linear-gradient(90deg, transparent, " + (E(o).accent_color || "#C9F24E") + ", transparent)" })
            }, null, 4),
            w("div", Yg, [
              !rt.value && (er.value || !E(qe)) ? (T(), S("div", {
                key: 0,
                class: "header-orb",
                style: Ae(fs.value)
              }, null, 4)) : rt.value || E(qe) ? (T(), S("img", {
                key: 1,
                src: rt.value || E(qe),
                alt: E(V).human_agent_name || E(a),
                class: "header-avatar"
              }, null, 8, Xg)) : oe("", !0),
              w("div", Zg, [
                w("h3", {
                  style: Ae(E(De))
                }, re(E(V).human_agent_name || E(a)), 5),
                g[30] || (g[30] = w("div", { class: "status" }, [
                  w("span", { class: "status-indicator online" }),
                  w("span", { class: "status-text cm-presence" }, "Online · replies instantly")
                ], -1))
              ])
            ]),
            w("button", {
              type: "button",
              class: "header-minimize",
              style: Ae(E(De)),
              title: "Minimize",
              "aria-label": "Minimize chat",
              onClick: Wn
            }, g[31] || (g[31] = [
              w("svg", {
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
                w("path", { d: "M6 9l6 6 6-6" })
              ], -1)
            ]), 4)
          ], 4)),
          E(j) ? (T(), S("div", tm, g[32] || (g[32] = [
            w("div", { class: "loading-spinner" }, [
              w("div", { class: "dot" }),
              w("div", { class: "dot" }),
              w("div", { class: "dot" })
            ], -1)
          ]))) : oe("", !0),
          ds.value ? (T(), S("div", {
            key: 3,
            class: "cm-email-gate",
            style: Ae(E(Q))
          }, [
            w("div", {
              class: "cm-email-gate-orb",
              style: Ae(fs.value)
            }, null, 4),
            w("h3", nm, re(E(o).welcome_title || "Before we start"), 1),
            g[33] || (g[33] = w("p", { class: "cm-email-gate-text" }, "Enter your email and we'll continue the chat.", -1)),
            xn(w("input", {
              "onUpdate:modelValue": g[4] || (g[4] = (u) => ve.value = u),
              type: "email",
              inputmode: "email",
              autocomplete: "email",
              placeholder: "you@example.com",
              class: Xe(["cm-email-gate-input", { invalid: !!kn.value }]),
              disabled: hs.value,
              onKeyup: ci(Oo, ["enter"]),
              onInput: g[5] || (g[5] = (u) => kn.value = "")
            }, null, 42, sm), [
              [Bn, ve.value]
            ]),
            kn.value ? (T(), S("p", rm, re(kn.value), 1)) : oe("", !0),
            w("button", {
              type: "button",
              class: "cm-email-gate-btn",
              style: Ae(E(pe)),
              disabled: hs.value,
              onClick: Oo
            }, re(hs.value ? "Please wait…" : "Continue to chat"), 13, im)
          ], 4)) : oe("", !0),
          xn(w("div", {
            class: "chat-messages",
            ref_key: "messagesContainer",
            ref: G
          }, [
            jc.value ? (T(), S("div", om, [
              w("div", am, [
                er.value || !E(qe) ? (T(), S("div", {
                  key: 0,
                  class: "cm-welcome-orb",
                  style: Ae(fs.value)
                }, null, 4)) : (T(), S("img", {
                  key: 1,
                  src: E(qe),
                  alt: E(a),
                  class: "cm-welcome-avatar"
                }, null, 8, lm)),
                w("div", {
                  class: "message-bubble cm-welcome-bubble",
                  style: Ae(E(Oe))
                }, re(Co.value), 5)
              ])
            ])) : oe("", !0),
            (T(!0), S(et, null, Nt(E(b), (u, J) => {
              var we, fe, je, ke, jt, ps, Vn, Fo, Mo, Do, Bo, $o, Uo, zo, Ho, qo, Wo, jo, Vo;
              return T(), S("div", {
                key: J,
                class: Xe([
                  "message",
                  u.message_type === "bot" || u.message_type === "agent" ? "agent-message" : u.message_type === "system" ? "system-message" : u.message_type === "rating" ? "rating-message" : u.message_type === "form" ? "form-message" : u.message_type === "product" || u.shopify_output ? "product-message" : "user-message"
                ])
              }, [
                u.message_type === "bot" || u.message_type === "agent" ? (T(), S("div", cm, [
                  rt.value ? (T(), S("img", {
                    key: 0,
                    src: rt.value,
                    class: "cm-msg-avatar-img",
                    alt: ""
                  }, null, 8, um)) : !er.value && E(qe) ? (T(), S("img", {
                    key: 1,
                    src: E(qe),
                    class: "cm-msg-avatar-img",
                    alt: ""
                  }, null, 8, fm)) : (T(), S("div", {
                    key: 2,
                    class: "cm-msg-avatar-orb",
                    style: Ae(fs.value)
                  }, null, 4))
                ])) : oe("", !0),
                w("div", hm, [
                  w("div", {
                    class: "message-bubble",
                    style: Ae(u.message_type === "system" || u.message_type === "rating" || u.message_type === "form" || u.message_type === "product" || u.shopify_output ? {} : u.message_type === "user" ? E(pe) : E(Oe))
                  }, [
                    u.message_type === "rating" ? (T(), S("div", dm, [
                      w("p", pm, "Rate the chat session that you had with " + re(u.agent_name || E(V).human_agent_name || E(a) || "our agent"), 1),
                      w("div", {
                        class: Xe(["star-rating", { submitted: _.value || u.isSubmitted }])
                      }, [
                        (T(), S(et, null, Nt(5, (C) => w("button", {
                          key: C,
                          class: Xe(["star-button", {
                            warning: C <= (u.isSubmitted ? u.finalRating : Z.value || u.selectedRating) && (u.isSubmitted ? u.finalRating : Z.value || u.selectedRating) <= 3,
                            success: C <= (u.isSubmitted ? u.finalRating : Z.value || u.selectedRating) && (u.isSubmitted ? u.finalRating : Z.value || u.selectedRating) > 3,
                            selected: C <= (u.isSubmitted ? u.finalRating : Z.value || u.selectedRating)
                          }]),
                          onMouseover: (Vt) => !u.isSubmitted && Qs(C),
                          onMouseleave: (Vt) => !u.isSubmitted && Cc,
                          onClick: (Vt) => !u.isSubmitted && Rc(C),
                          disabled: _.value || u.isSubmitted
                        }, " ★ ", 42, gm)), 64))
                      ], 2),
                      u.showFeedback && !u.isSubmitted ? (T(), S("div", mm, [
                        w("div", _m, [
                          xn(w("input", {
                            "onUpdate:modelValue": (C) => u.feedback = C,
                            placeholder: "Please share your feedback (optional)",
                            disabled: _.value,
                            maxlength: "500",
                            class: "feedback-input"
                          }, null, 8, ym), [
                            [Bn, u.feedback]
                          ]),
                          w("div", vm, re(((we = u.feedback) == null ? void 0 : we.length) || 0) + "/500", 1)
                        ]),
                        w("button", {
                          onClick: (C) => Ic(u.session_id, Z.value, u.feedback),
                          disabled: _.value || !Z.value,
                          class: "submit-rating-button",
                          style: Ae({ backgroundColor: E(o).accent_color || "var(--accent-solid)" })
                        }, re(_.value ? "Submitting..." : "Submit Rating"), 13, bm)
                      ])) : oe("", !0),
                      u.isSubmitted && u.finalFeedback ? (T(), S("div", wm, [
                        w("div", km, [
                          w("p", xm, re(u.finalFeedback), 1)
                        ])
                      ])) : u.isSubmitted ? (T(), S("div", Am, " Thank you for your rating! ")) : oe("", !0)
                    ])) : u.message_type === "form" ? (T(), S("div", Tm, [
                      (je = (fe = u.attributes) == null ? void 0 : fe.form_data) != null && je.title || (jt = (ke = u.attributes) == null ? void 0 : ke.form_data) != null && jt.description ? (T(), S("div", Sm, [
                        (Vn = (ps = u.attributes) == null ? void 0 : ps.form_data) != null && Vn.title ? (T(), S("h3", Em, re(u.attributes.form_data.title), 1)) : oe("", !0),
                        (Mo = (Fo = u.attributes) == null ? void 0 : Fo.form_data) != null && Mo.description ? (T(), S("p", Cm, re(u.attributes.form_data.description), 1)) : oe("", !0)
                      ])) : oe("", !0),
                      w("div", Rm, [
                        (T(!0), S(et, null, Nt((Bo = (Do = u.attributes) == null ? void 0 : Do.form_data) == null ? void 0 : Bo.fields, (C) => {
                          var Vt, Jr;
                          return T(), S("div", {
                            key: C.name,
                            class: "form-field"
                          }, [
                            w("label", {
                              for: `form-${C.name}`,
                              class: "field-label"
                            }, [
                              cn(re(C.label) + " ", 1),
                              C.required ? (T(), S("span", Lm, "*")) : oe("", !0)
                            ], 8, Im),
                            C.type === "text" || C.type === "email" || C.type === "tel" ? (T(), S("input", {
                              key: 0,
                              id: `form-${C.name}`,
                              type: C.type,
                              placeholder: C.placeholder || "",
                              required: C.required,
                              minlength: C.minLength,
                              maxlength: C.maxLength,
                              value: I.value[C.name] || "",
                              onInput: ($e) => Pt(C.name, $e.target.value),
                              onBlur: ($e) => Pt(C.name, $e.target.value),
                              class: Xe(["form-input", { error: ge.value[C.name] }]),
                              disabled: H.value,
                              autocomplete: C.type === "email" ? "email" : C.type === "tel" ? "tel" : "off",
                              inputmode: C.type === "tel" ? "tel" : C.type === "email" ? "email" : "text"
                            }, null, 42, Om)) : C.type === "number" ? (T(), S("input", {
                              key: 1,
                              id: `form-${C.name}`,
                              type: "number",
                              placeholder: C.placeholder || "",
                              required: C.required,
                              min: C.min,
                              max: C.max,
                              value: I.value[C.name] || "",
                              onInput: ($e) => Pt(C.name, $e.target.value),
                              class: Xe(["form-input", { error: ge.value[C.name] }]),
                              disabled: H.value
                            }, null, 42, Pm)) : C.type === "textarea" ? (T(), S("textarea", {
                              key: 2,
                              id: `form-${C.name}`,
                              placeholder: C.placeholder || "",
                              required: C.required,
                              minlength: C.minLength,
                              maxlength: C.maxLength,
                              value: I.value[C.name] || "",
                              onInput: ($e) => Pt(C.name, $e.target.value),
                              class: Xe(["form-textarea", { error: ge.value[C.name] }]),
                              disabled: H.value,
                              rows: "3"
                            }, null, 42, Nm)) : C.type === "select" ? (T(), S("select", {
                              key: 3,
                              id: `form-${C.name}`,
                              required: C.required,
                              value: I.value[C.name] || "",
                              onChange: ($e) => Pt(C.name, $e.target.value),
                              class: Xe(["form-select", { error: ge.value[C.name] }]),
                              disabled: H.value
                            }, [
                              w("option", Mm, re(C.placeholder || "Select an option"), 1),
                              (T(!0), S(et, null, Nt((Array.isArray(C.options) ? C.options : ((Vt = C.options) == null ? void 0 : Vt.split(`
`)) || []).filter(($e) => $e.trim()), ($e) => (T(), S("option", {
                                key: $e.trim(),
                                value: $e.trim()
                              }, re($e.trim()), 9, Dm))), 128))
                            ], 42, Fm)) : C.type === "checkbox" ? (T(), S("div", Bm, [
                              w("input", {
                                id: `form-${C.name}`,
                                type: "checkbox",
                                checked: I.value[C.name] || !1,
                                onChange: ($e) => Pt(C.name, $e.target.checked),
                                class: "form-checkbox",
                                disabled: H.value
                              }, null, 40, $m),
                              w("label", {
                                for: `form-${C.name}`,
                                class: "checkbox-label"
                              }, re(C.placeholder || C.label), 9, Um)
                            ])) : C.type === "radio" ? (T(), S("div", zm, [
                              (T(!0), S(et, null, Nt((Array.isArray(C.options) ? C.options : ((Jr = C.options) == null ? void 0 : Jr.split(`
`)) || []).filter(($e) => $e.trim()), ($e) => (T(), S("div", {
                                key: $e.trim(),
                                class: "radio-option"
                              }, [
                                w("input", {
                                  id: `form-${C.name}-${$e.trim()}`,
                                  name: `form-${C.name}`,
                                  type: "radio",
                                  value: $e.trim(),
                                  checked: I.value[C.name] === $e.trim(),
                                  onChange: (cy) => Pt(C.name, $e.trim()),
                                  class: "form-radio",
                                  disabled: H.value
                                }, null, 40, Hm),
                                w("label", {
                                  for: `form-${C.name}-${$e.trim()}`,
                                  class: "radio-label"
                                }, re($e.trim()), 9, qm)
                              ]))), 128))
                            ])) : oe("", !0),
                            ge.value[C.name] ? (T(), S("div", Wm, re(ge.value[C.name]), 1)) : oe("", !0)
                          ]);
                        }), 128))
                      ]),
                      w("div", jm, [
                        w("button", {
                          onClick: () => {
                            var C;
                            console.log("Regular form submit button clicked!"), Oc((C = u.attributes) == null ? void 0 : C.form_data);
                          },
                          disabled: H.value,
                          class: "form-submit-button",
                          style: Ae(E(pe))
                        }, re(H.value ? "Submitting..." : ((Uo = ($o = u.attributes) == null ? void 0 : $o.form_data) == null ? void 0 : Uo.submit_button_text) || "Submit"), 13, Vm)
                      ])
                    ])) : u.message_type === "user_input" ? (T(), S("div", Km, [
                      (zo = u.attributes) != null && zo.prompt_message && u.attributes.prompt_message.trim() ? (T(), S("div", Gm, re(u.attributes.prompt_message), 1)) : oe("", !0),
                      u.isSubmitted ? (T(), S("div", Jm, [
                        g[34] || (g[34] = w("strong", null, "Your input:", -1)),
                        cn(" " + re(u.submittedValue) + " ", 1),
                        (Ho = u.attributes) != null && Ho.confirmation_message && u.attributes.confirmation_message.trim() ? (T(), S("div", Qm, re(u.attributes.confirmation_message), 1)) : oe("", !0)
                      ])) : (T(), S("div", Ym, [
                        xn(w("textarea", {
                          "onUpdate:modelValue": (C) => u.userInputValue = C,
                          class: "user-input-textarea",
                          placeholder: "Type your message here...",
                          rows: "3",
                          onKeydown: [
                            ci(Gn((C) => Gr(u), ["ctrl"]), ["enter"]),
                            ci(Gn((C) => Gr(u), ["meta"]), ["enter"])
                          ]
                        }, null, 40, Xm), [
                          [Bn, u.userInputValue]
                        ]),
                        w("button", {
                          class: "user-input-submit-button",
                          onClick: (C) => Gr(u),
                          disabled: !u.userInputValue || !u.userInputValue.trim()
                        }, " Submit ", 8, Zm)
                      ]))
                    ])) : u.shopify_output || u.message_type === "product" ? (T(), S("div", e_, [
                      u.message ? (T(), S("div", {
                        key: 0,
                        innerHTML: s(((Wo = (qo = u.shopify_output) == null ? void 0 : qo.products) == null ? void 0 : Wo.length) > 0 ? Mc(u.message) : u.message),
                        class: "product-message-text"
                      }, null, 8, t_)) : oe("", !0),
                      (jo = u.shopify_output) != null && jo.products && u.shopify_output.products.length > 0 ? (T(), S("div", n_, [
                        g[36] || (g[36] = w("h3", { class: "carousel-title" }, "Products", -1)),
                        w("div", s_, [
                          (T(!0), S(et, null, Nt(u.shopify_output.products, (C) => {
                            var Vt;
                            return T(), S("div", {
                              key: C.id,
                              class: "product-card-compact carousel-item"
                            }, [
                              (Vt = C.image) != null && Vt.src ? (T(), S("div", r_, [
                                w("img", {
                                  src: C.image.src,
                                  alt: C.title,
                                  class: "product-thumbnail"
                                }, null, 8, i_)
                              ])) : oe("", !0),
                              w("div", o_, [
                                w("div", a_, [
                                  w("div", l_, re(C.title), 1),
                                  C.variant_title && C.variant_title !== "Default Title" ? (T(), S("div", c_, re(C.variant_title), 1)) : oe("", !0),
                                  w("div", u_, re(C.price_formatted || E(c)(C.price, C.currency)), 1)
                                ]),
                                w("div", f_, [
                                  w("button", {
                                    class: "view-details-button-compact",
                                    onClick: (Jr) => {
                                      var $e;
                                      return Fc(C, ($e = u.shopify_output) == null ? void 0 : $e.shop_domain);
                                    }
                                  }, g[35] || (g[35] = [
                                    cn(" View product ", -1),
                                    w("span", { class: "external-link-icon" }, "↗", -1)
                                  ]), 8, h_)
                                ])
                              ])
                            ]);
                          }), 128))
                        ])
                      ])) : !u.message && ((Vo = u.shopify_output) != null && Vo.products) && u.shopify_output.products.length === 0 ? (T(), S("div", d_, g[37] || (g[37] = [
                        w("p", null, "No products found.", -1)
                      ]))) : !u.message && u.shopify_output && !u.shopify_output.products ? (T(), S("div", p_, g[38] || (g[38] = [
                        w("p", null, "No products to display.", -1)
                      ]))) : oe("", !0)
                    ])) : (T(), S(et, { key: 4 }, [
                      E(ot)(J) ? (T(), S("div", {
                        key: 0,
                        class: "message-streaming",
                        innerHTML: s(E(ft)(J, u.message))
                      }, null, 8, g_)) : (T(), S("div", {
                        key: 1,
                        innerHTML: s(u.message)
                      }, null, 8, m_)),
                      u.attachments && u.attachments.length > 0 ? (T(), S("div", __, [
                        (T(!0), S(et, null, Nt(u.attachments, (C) => (T(), S("div", {
                          key: C.id,
                          class: "attachment-item"
                        }, [
                          E(ee)(C.content_type) ? (T(), S("div", y_, [
                            w("img", {
                              src: E(be)(C.file_url),
                              alt: C.filename,
                              class: "attachment-image",
                              onClick: Gn((Vt) => E(is)({ url: C.file_url, filename: C.filename, type: C.content_type, file_url: E(be)(C.file_url), size: void 0 }), ["stop"]),
                              style: { cursor: "pointer" }
                            }, null, 8, v_),
                            w("div", b_, [
                              w("a", {
                                href: E(be)(C.file_url),
                                target: "_blank",
                                class: "attachment-link"
                              }, [
                                g[39] || (g[39] = w("svg", {
                                  width: "14",
                                  height: "14",
                                  viewBox: "0 0 24 24",
                                  fill: "none",
                                  stroke: "currentColor",
                                  "stroke-width": "2",
                                  "stroke-linecap": "round",
                                  "stroke-linejoin": "round"
                                }, [
                                  w("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                                  w("polyline", { points: "7 10 12 15 17 10" }),
                                  w("line", {
                                    x1: "12",
                                    y1: "15",
                                    x2: "12",
                                    y2: "3"
                                  })
                                ], -1)),
                                cn(" " + re(C.filename) + " ", 1),
                                w("span", k_, "(" + re(E(Y)(C.file_size)) + ")", 1)
                              ], 8, w_)
                            ])
                          ])) : (T(), S("a", {
                            key: 1,
                            href: E(be)(C.file_url),
                            target: "_blank",
                            class: "attachment-link"
                          }, [
                            g[40] || (g[40] = w("svg", {
                              width: "14",
                              height: "14",
                              viewBox: "0 0 24 24",
                              fill: "none",
                              stroke: "currentColor",
                              "stroke-width": "2",
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round"
                            }, [
                              w("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" })
                            ], -1)),
                            cn(" " + re(C.filename) + " ", 1),
                            w("span", A_, "(" + re(E(Y)(C.file_size)) + ")", 1)
                          ], 8, x_))
                        ]))), 128))
                      ])) : oe("", !0)
                    ], 64))
                  ], 4),
                  Yr.value && (u.message_type === "bot" || u.message_type === "agent") && u.sources && u.sources.length ? (T(), S("div", T_, [
                    g[41] || (g[41] = w("span", { class: "citation-label" }, "Sources", -1)),
                    (T(!0), S(et, null, Nt(u.sources, (C, Vt) => (T(), S("span", {
                      key: Vt,
                      class: "citation-chip",
                      title: Yc(C)
                    }, re(Io(C)), 9, S_))), 128))
                  ])) : oe("", !0),
                  w("div", E_, [
                    u.message_type === "user" ? (T(), S("span", C_, " You ")) : oe("", !0)
                  ])
                ])
              ], 2);
            }), 128)),
            E(m) ? (T(), S("div", {
              key: 1,
              class: Xe(["typing-indicator", { "reading-indicator": Yr.value }])
            }, [
              Yr.value ? (T(), S(et, { key: 0 }, [
                g[42] || (g[42] = w("div", {
                  class: "reading-bars",
                  "aria-hidden": "true"
                }, [
                  w("span"),
                  w("span"),
                  w("span")
                ], -1)),
                g[43] || (g[43] = w("span", { class: "reading-label" }, "reading knowledge base", -1))
              ], 64)) : (T(), S("div", {
                key: 1,
                class: "cm-typing-bubble",
                style: Ae(E(Oe))
              }, g[44] || (g[44] = [
                w("span", { class: "cm-typing-dot" }, null, -1),
                w("span", { class: "cm-typing-dot" }, null, -1),
                w("span", { class: "cm-typing-dot" }, null, -1)
              ]), 4))
            ], 2)) : oe("", !0)
          ], 512), [
            [eh, !ds.value]
          ]),
          Vc.value ? (T(), S("div", R_, [
            (T(!0), S(et, null, Nt(Eo.value, (u) => (T(), S("button", {
              key: u,
              type: "button",
              class: "cm-quick-action",
              disabled: !qt.value,
              onClick: (J) => bn(u)
            }, re(u), 9, I_))), 128))
          ])) : oe("", !0),
          !wn.value && !ds.value ? (T(), S("div", {
            key: 5,
            class: Xe(["chat-input", { "ask-anything-input": Wt.value }])
          }, [
            w("input", {
              ref_key: "fileInputRef",
              ref: v,
              type: "file",
              accept: ny,
              multiple: "",
              style: { display: "none" },
              onChange: g[6] || (g[6] = //@ts-ignore
              (...u) => E(Ge) && E(Ge)(...u))
            }, null, 544),
            E(A).length > 0 ? (T(), S("div", L_, [
              (T(!0), S(et, null, Nt(E(A), (u, J) => (T(), S("div", {
                key: J,
                class: "file-preview-widget"
              }, [
                w("div", O_, [
                  E(os)(u.type) ? (T(), S("img", {
                    key: 0,
                    src: E(Se)(u),
                    alt: u.filename,
                    class: "file-preview-image-widget",
                    onClick: Gn((we) => E(is)(u), ["stop"]),
                    style: { cursor: "pointer" }
                  }, null, 8, P_)) : (T(), S("div", {
                    key: 1,
                    class: "file-preview-icon-widget",
                    onClick: Gn((we) => E(is)(u), ["stop"]),
                    style: { cursor: "pointer" }
                  }, g[45] || (g[45] = [
                    w("svg", {
                      width: "20",
                      height: "20",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      "stroke-width": "2"
                    }, [
                      w("path", { d: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" }),
                      w("polyline", { points: "13 2 13 9 20 9" })
                    ], -1)
                  ]), 8, N_))
                ]),
                w("div", F_, [
                  w("div", M_, re(u.filename), 1),
                  w("div", D_, re(E(Y)(u.size)), 1)
                ]),
                w("button", {
                  type: "button",
                  class: "file-preview-remove-widget",
                  onClick: (we) => E(Xt)(J),
                  title: "Remove file"
                }, " × ", 8, B_)
              ]))), 128))
            ])) : oe("", !0),
            xo.value ? (T(), S("div", $_, g[46] || (g[46] = [
              w("div", { class: "upload-spinner-widget" }, null, -1),
              w("span", { class: "upload-text-widget" }, "Uploading files...", -1)
            ]))) : oe("", !0),
            w("div", U_, [
              xn(w("input", {
                "onUpdate:modelValue": g[7] || (g[7] = (u) => ie.value = u),
                type: "text",
                placeholder: Ys.value,
                onKeypress: as,
                onInput: de,
                onChange: de,
                onPaste: g[8] || (g[8] = //@ts-ignore
                (...u) => E(We) && E(We)(...u)),
                onDrop: g[9] || (g[9] = //@ts-ignore
                (...u) => E(Me) && E(Me)(...u)),
                onDragover: g[10] || (g[10] = //@ts-ignore
                (...u) => E(dt) && E(dt)(...u)),
                onDragleave: g[11] || (g[11] = //@ts-ignore
                (...u) => E(bt) && E(bt)(...u)),
                disabled: !qt.value,
                class: Xe({ disabled: !qt.value, "ask-anything-field": Wt.value })
              }, null, 42, z_), [
                [Bn, ie.value]
              ]),
              Dc.value ? (T(), S("button", {
                key: 0,
                type: "button",
                class: "attach-button",
                disabled: xo.value,
                onClick: g[12] || (g[12] = //@ts-ignore
                (...u) => E(qn) && E(qn)(...u)),
                title: `Attach files (${E(A).length}/${Va} used) or paste screenshots`
              }, g[47] || (g[47] = [
                w("svg", {
                  width: "22",
                  height: "22",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  xmlns: "http://www.w3.org/2000/svg"
                }, [
                  w("path", {
                    d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
                    stroke: "currentColor",
                    "stroke-width": "2.2",
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round"
                  })
                ], -1),
                w("span", { class: "attach-button-glow" }, null, -1)
              ]), 8, H_)) : oe("", !0),
              w("button", {
                class: Xe(["send-button", { "ask-anything-send": Wt.value }]),
                style: Ae(E(pe)),
                onClick: mt,
                disabled: !ie.value.trim() && E(A).length === 0 || !qt.value
              }, g[48] || (g[48] = [
                w("svg", {
                  width: "20",
                  height: "20",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  xmlns: "http://www.w3.org/2000/svg"
                }, [
                  w("path", {
                    d: "M12 19V5M5 12l7-7 7 7",
                    stroke: "currentColor",
                    "stroke-width": "2.2",
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round"
                  })
                ], -1)
              ]), 14, q_)
            ])
          ], 2)) : wn.value && !ds.value ? (T(), S("div", W_, [
            w("div", j_, [
              g[49] || (g[49] = w("p", { class: "ended-text" }, "This chat has ended.", -1)),
              w("button", {
                class: "start-new-conversation-button",
                style: Ae(E(pe)),
                onClick: zc
              }, " Click here to start a new conversation ", 4)
            ])
          ])) : oe("", !0),
          Kc.value ? (T(), S("div", {
            key: 7,
            class: "ai-disclaimer",
            style: Ae(E(De))
          }, re(E(Od)), 5)) : oe("", !0),
          w("div", {
            class: "powered-by",
            style: Ae(E(De))
          }, g[50] || (g[50] = [
            Dn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-f87cdb68><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-f87cdb68></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-f87cdb68></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-f87cdb68><span class="cm-powered-prefix" data-v-f87cdb68>Powered by </span><strong class="cm-brand" data-v-f87cdb68>ChatterMate</strong></a>', 2)
          ]), 4)
        ], 6)) : oe("", !0)
      ], 64)),
      cs.value ? (T(), S("div", V_, [
        w("div", K_, [
          g[51] || (g[51] = w("h3", null, "Rate your conversation", -1)),
          w("div", G_, [
            (T(), S(et, null, Nt(5, (u) => w("button", {
              key: u,
              onClick: (J) => Nn.value = u,
              class: Xe([{ active: u <= Nn.value }, "star-button"])
            }, " ★ ", 10, Y_)), 64))
          ]),
          xn(w("textarea", {
            "onUpdate:modelValue": g[13] || (g[13] = (u) => us.value = u),
            placeholder: "Additional feedback (optional)",
            class: "rating-feedback"
          }, null, 512), [
            [Bn, us.value]
          ]),
          w("div", X_, [
            w("button", {
              onClick: g[14] || (g[14] = (u) => d.submitRating(Nn.value, us.value)),
              disabled: !Nn.value,
              class: "submit-button",
              style: Ae(E(pe))
            }, " Submit ", 12, Z_),
            w("button", {
              onClick: g[15] || (g[15] = (u) => cs.value = !1),
              class: "skip-rating"
            }, " Skip ")
          ])
        ])
      ])) : oe("", !0),
      E(x) ? (T(), S("div", {
        key: 8,
        class: "preview-modal-overlay",
        onClick: g[18] || (g[18] = //@ts-ignore
        (...u) => E(Pn) && E(Pn)(...u))
      }, [
        w("div", {
          class: "preview-modal-content",
          onClick: g[17] || (g[17] = Gn(() => {
          }, ["stop"]))
        }, [
          w("button", {
            class: "preview-modal-close",
            onClick: g[16] || (g[16] = //@ts-ignore
            (...u) => E(Pn) && E(Pn)(...u))
          }, "×"),
          E(F) && E(os)(E(F).type) ? (T(), S("div", J_, [
            w("img", {
              src: E(Se)(E(F)),
              alt: E(F).filename,
              class: "preview-modal-image"
            }, null, 8, Q_),
            w("div", ey, re(E(F).filename), 1)
          ])) : oe("", !0)
        ])
      ])) : oe("", !0)
    ], 6)) : (T(), S("div", ty));
  }
}), ry = (t, e) => {
  const n = t.__vccOpts || t;
  for (const [s, r] of e)
    n[s] = r;
  return n;
}, iy = /* @__PURE__ */ ry(sy, [["__scopeId", "data-v-f87cdb68"]]);
window.process || (window.process = { env: { NODE_ENV: "production" } });
const $t = window.__INITIAL_DATA__, Tc = new URL(window.location.href), Sc = Tc.searchParams.get("preview") === "true", Ec = (t) => {
  const e = Tc.searchParams.get(t);
  if (!(!e || e === "undefined" || e.trim() === ""))
    return e;
}, oy = Sc ? Ec("widget_id") || ($t == null ? void 0 : $t.widgetId) || void 0 : ($t == null ? void 0 : $t.widgetId) || void 0, ay = Sc ? ($t == null ? void 0 : $t.initialToken) || Ec("token") || void 0 : ($t == null ? void 0 : $t.initialToken) || void 0, ly = bh(iy, {
  widgetId: oy,
  token: ay || void 0,
  initialAuthError: null
  // Let backend determine if auth is required
});
ly.mount("#app");

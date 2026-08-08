var fu = Object.defineProperty;
var hu = (e, t, n) => t in e ? fu(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Qe = (e, t, n) => hu(e, typeof t != "symbol" ? t + "" : t, n);
/**
* @vue/shared v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function Jr(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const et = {}, ns = [], an = () => {
}, du = () => !1, Di = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), Qr = (e) => e.startsWith("onUpdate:"), xt = Object.assign, eo = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, pu = Object.prototype.hasOwnProperty, We = (e, t) => pu.call(e, t), pe = Array.isArray, ss = (e) => Bi(e) === "[object Map]", nl = (e) => Bi(e) === "[object Set]", ye = (e) => typeof e == "function", pt = (e) => typeof e == "string", On = (e) => typeof e == "symbol", at = (e) => e !== null && typeof e == "object", sl = (e) => (at(e) || ye(e)) && ye(e.then) && ye(e.catch), il = Object.prototype.toString, Bi = (e) => il.call(e), gu = (e) => Bi(e).slice(8, -1), rl = (e) => Bi(e) === "[object Object]", to = (e) => pt(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Os = /* @__PURE__ */ Jr(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), $i = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return (n) => t[n] || (t[n] = e(n));
}, mu = /-(\w)/g, Rn = $i(
  (e) => e.replace(mu, (t, n) => n ? n.toUpperCase() : "")
), _u = /\B([A-Z])/g, Pn = $i(
  (e) => e.replace(_u, "-$1").toLowerCase()
), ol = $i((e) => e.charAt(0).toUpperCase() + e.slice(1)), cr = $i(
  (e) => e ? `on${ol(e)}` : ""
), En = (e, t) => !Object.is(e, t), hi = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, Rr = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, Ir = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
};
let ta;
const Ui = () => ta || (ta = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Te(e) {
  if (pe(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], i = pt(s) ? wu(s) : Te(s);
      if (i)
        for (const r in i)
          t[r] = i[r];
    }
    return t;
  } else if (pt(e) || at(e))
    return e;
}
const yu = /;(?![^(]*\))/g, vu = /:([^]+)/, bu = /\/\*[^]*?\*\//g;
function wu(e) {
  const t = {};
  return e.replace(bu, "").split(yu).forEach((n) => {
    if (n) {
      const s = n.split(vu);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function Ke(e) {
  let t = "";
  if (pt(e))
    t = e;
  else if (pe(e))
    for (let n = 0; n < e.length; n++) {
      const s = Ke(e[n]);
      s && (t += s + " ");
    }
  else if (at(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const ku = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", xu = /* @__PURE__ */ Jr(ku);
function al(e) {
  return !!e || e === "";
}
const ll = (e) => !!(e && e.__v_isRef === !0), ne = (e) => pt(e) ? e : e == null ? "" : pe(e) || at(e) && (e.toString === il || !ye(e.toString)) ? ll(e) ? ne(e.value) : JSON.stringify(e, cl, 2) : String(e), cl = (e, t) => ll(t) ? cl(e, t.value) : ss(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, i], r) => (n[ur(s, r) + " =>"] = i, n),
    {}
  )
} : nl(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => ur(n))
} : On(t) ? ur(t) : at(t) && !pe(t) && !rl(t) ? String(t) : t, ur = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    On(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Pt;
class Au {
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this.parent = Pt, !t && Pt && (this.index = (Pt.scopes || (Pt.scopes = [])).push(
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
      const n = Pt;
      try {
        return Pt = this, t();
      } finally {
        Pt = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = Pt, Pt = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    this._on > 0 && --this._on === 0 && (Pt = this.prevScope, this.prevScope = void 0);
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
function Tu() {
  return Pt;
}
let it;
const fr = /* @__PURE__ */ new WeakSet();
class ul {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, Pt && Pt.active && Pt.effects.push(this);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, fr.has(this) && (fr.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || hl(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, na(this), dl(this);
    const t = it, n = en;
    it = this, en = !0;
    try {
      return this.fn();
    } finally {
      pl(this), it = t, en = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        io(t);
      this.deps = this.depsTail = void 0, na(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? fr.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    Lr(this) && this.run();
  }
  get dirty() {
    return Lr(this);
  }
}
let fl = 0, Ps, Ms;
function hl(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = Ms, Ms = e;
    return;
  }
  e.next = Ps, Ps = e;
}
function no() {
  fl++;
}
function so() {
  if (--fl > 0)
    return;
  if (Ms) {
    let t = Ms;
    for (Ms = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; Ps; ) {
    let t = Ps;
    for (Ps = void 0; t; ) {
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
function dl(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function pl(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const i = s.prevDep;
    s.version === -1 ? (s === n && (n = i), io(s), Su(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = i;
  }
  e.deps = t, e.depsTail = n;
}
function Lr(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (gl(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function gl(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Us) || (e.globalVersion = Us, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Lr(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = it, s = en;
  it = e, en = !0;
  try {
    dl(e);
    const i = e.fn(e._value);
    (t.version === 0 || En(i, e._value)) && (e.flags |= 128, e._value = i, t.version++);
  } catch (i) {
    throw t.version++, i;
  } finally {
    it = n, en = s, pl(e), e.flags &= -3;
  }
}
function io(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: i } = e;
  if (s && (s.nextSub = i, e.prevSub = void 0), i && (i.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let r = n.computed.deps; r; r = r.nextDep)
      io(r, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Su(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let en = !0;
const ml = [];
function bn() {
  ml.push(en), en = !1;
}
function wn() {
  const e = ml.pop();
  en = e === void 0 ? !0 : e;
}
function na(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = it;
    it = void 0;
    try {
      t();
    } finally {
      it = n;
    }
  }
}
let Us = 0;
class Eu {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class ro {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!it || !en || it === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== it)
      n = this.activeLink = new Eu(it, this), it.deps ? (n.prevDep = it.depsTail, it.depsTail.nextDep = n, it.depsTail = n) : it.deps = it.depsTail = n, _l(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = it.depsTail, n.nextDep = void 0, it.depsTail.nextDep = n, it.depsTail = n, it.deps === n && (it.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, Us++, this.notify(t);
  }
  notify(t) {
    no();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      so();
    }
  }
}
function _l(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        _l(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const Or = /* @__PURE__ */ new WeakMap(), Wn = Symbol(
  ""
), Pr = Symbol(
  ""
), zs = Symbol(
  ""
);
function wt(e, t, n) {
  if (en && it) {
    let s = Or.get(e);
    s || Or.set(e, s = /* @__PURE__ */ new Map());
    let i = s.get(n);
    i || (s.set(n, i = new ro()), i.map = s, i.key = n), i.track();
  }
}
function mn(e, t, n, s, i, r) {
  const o = Or.get(e);
  if (!o) {
    Us++;
    return;
  }
  const a = (l) => {
    l && l.trigger();
  };
  if (no(), t === "clear")
    o.forEach(a);
  else {
    const l = pe(e), h = l && to(n);
    if (l && n === "length") {
      const c = Number(s);
      o.forEach((w, _) => {
        (_ === "length" || _ === zs || !On(_) && _ >= c) && a(w);
      });
    } else
      switch ((n !== void 0 || o.has(void 0)) && a(o.get(n)), h && a(o.get(zs)), t) {
        case "add":
          l ? h && a(o.get("length")) : (a(o.get(Wn)), ss(e) && a(o.get(Pr)));
          break;
        case "delete":
          l || (a(o.get(Wn)), ss(e) && a(o.get(Pr)));
          break;
        case "set":
          ss(e) && a(o.get(Wn));
          break;
      }
  }
  so();
}
function Qn(e) {
  const t = qe(e);
  return t === e ? t : (wt(t, "iterate", zs), Kt(e) ? t : t.map(bt));
}
function zi(e) {
  return wt(e = qe(e), "iterate", zs), e;
}
const Cu = {
  __proto__: null,
  [Symbol.iterator]() {
    return hr(this, Symbol.iterator, bt);
  },
  concat(...e) {
    return Qn(this).concat(
      ...e.map((t) => pe(t) ? Qn(t) : t)
    );
  },
  entries() {
    return hr(this, "entries", (e) => (e[1] = bt(e[1]), e));
  },
  every(e, t) {
    return hn(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return hn(this, "filter", e, t, (n) => n.map(bt), arguments);
  },
  find(e, t) {
    return hn(this, "find", e, t, bt, arguments);
  },
  findIndex(e, t) {
    return hn(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return hn(this, "findLast", e, t, bt, arguments);
  },
  findLastIndex(e, t) {
    return hn(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return hn(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return dr(this, "includes", e);
  },
  indexOf(...e) {
    return dr(this, "indexOf", e);
  },
  join(e) {
    return Qn(this).join(e);
  },
  // keys() iterator only reads `length`, no optimisation required
  lastIndexOf(...e) {
    return dr(this, "lastIndexOf", e);
  },
  map(e, t) {
    return hn(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return ms(this, "pop");
  },
  push(...e) {
    return ms(this, "push", e);
  },
  reduce(e, ...t) {
    return sa(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return sa(this, "reduceRight", e, t);
  },
  shift() {
    return ms(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return hn(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return ms(this, "splice", e);
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
    return ms(this, "unshift", e);
  },
  values() {
    return hr(this, "values", bt);
  }
};
function hr(e, t, n) {
  const s = zi(e), i = s[t]();
  return s !== e && !Kt(e) && (i._next = i.next, i.next = () => {
    const r = i._next();
    return r.value && (r.value = n(r.value)), r;
  }), i;
}
const Ru = Array.prototype;
function hn(e, t, n, s, i, r) {
  const o = zi(e), a = o !== e && !Kt(e), l = o[t];
  if (l !== Ru[t]) {
    const w = l.apply(e, r);
    return a ? bt(w) : w;
  }
  let h = n;
  o !== e && (a ? h = function(w, _) {
    return n.call(this, bt(w), _, e);
  } : n.length > 2 && (h = function(w, _) {
    return n.call(this, w, _, e);
  }));
  const c = l.call(o, h, s);
  return a && i ? i(c) : c;
}
function sa(e, t, n, s) {
  const i = zi(e);
  let r = n;
  return i !== e && (Kt(e) ? n.length > 3 && (r = function(o, a, l) {
    return n.call(this, o, a, l, e);
  }) : r = function(o, a, l) {
    return n.call(this, o, bt(a), l, e);
  }), i[t](r, ...s);
}
function dr(e, t, n) {
  const s = qe(e);
  wt(s, "iterate", zs);
  const i = s[t](...n);
  return (i === -1 || i === !1) && lo(n[0]) ? (n[0] = qe(n[0]), s[t](...n)) : i;
}
function ms(e, t, n = []) {
  bn(), no();
  const s = qe(e)[t].apply(e, n);
  return so(), wn(), s;
}
const Iu = /* @__PURE__ */ Jr("__proto__,__v_isRef,__isVue"), yl = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(On)
);
function Lu(e) {
  On(e) || (e = String(e));
  const t = qe(this);
  return wt(t, "has", e), t.hasOwnProperty(e);
}
class vl {
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
      return s === (i ? r ? zu : xl : r ? kl : wl).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const o = pe(t);
    if (!i) {
      let l;
      if (o && (l = Cu[n]))
        return l;
      if (n === "hasOwnProperty")
        return Lu;
    }
    const a = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      kt(t) ? t : s
    );
    return (On(n) ? yl.has(n) : Iu(n)) || (i || wt(t, "get", n), r) ? a : kt(a) ? o && to(n) ? a : a.value : at(a) ? i ? Al(a) : Hi(a) : a;
  }
}
class bl extends vl {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, i) {
    let r = t[n];
    if (!this._isShallow) {
      const l = In(r);
      if (!Kt(s) && !In(s) && (r = qe(r), s = qe(s)), !pe(t) && kt(r) && !kt(s))
        return l ? !1 : (r.value = s, !0);
    }
    const o = pe(t) && to(n) ? Number(n) < t.length : We(t, n), a = Reflect.set(
      t,
      n,
      s,
      kt(t) ? t : i
    );
    return t === qe(i) && (o ? En(s, r) && mn(t, "set", n, s) : mn(t, "add", n, s)), a;
  }
  deleteProperty(t, n) {
    const s = We(t, n);
    t[n];
    const i = Reflect.deleteProperty(t, n);
    return i && s && mn(t, "delete", n, void 0), i;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!On(n) || !yl.has(n)) && wt(t, "has", n), s;
  }
  ownKeys(t) {
    return wt(
      t,
      "iterate",
      pe(t) ? "length" : Wn
    ), Reflect.ownKeys(t);
  }
}
class Ou extends vl {
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
const Pu = /* @__PURE__ */ new bl(), Mu = /* @__PURE__ */ new Ou(), Nu = /* @__PURE__ */ new bl(!0);
const Mr = (e) => e, ii = (e) => Reflect.getPrototypeOf(e);
function Fu(e, t, n) {
  return function(...s) {
    const i = this.__v_raw, r = qe(i), o = ss(r), a = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, h = i[e](...s), c = n ? Mr : t ? Si : bt;
    return !t && wt(
      r,
      "iterate",
      l ? Pr : Wn
    ), {
      // iterator protocol
      next() {
        const { value: w, done: _ } = h.next();
        return _ ? { value: w, done: _ } : {
          value: a ? [c(w[0]), c(w[1])] : c(w),
          done: _
        };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
function ri(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function Du(e, t) {
  const n = {
    get(i) {
      const r = this.__v_raw, o = qe(r), a = qe(i);
      e || (En(i, a) && wt(o, "get", i), wt(o, "get", a));
      const { has: l } = ii(o), h = t ? Mr : e ? Si : bt;
      if (l.call(o, i))
        return h(r.get(i));
      if (l.call(o, a))
        return h(r.get(a));
      r !== o && r.get(i);
    },
    get size() {
      const i = this.__v_raw;
      return !e && wt(qe(i), "iterate", Wn), Reflect.get(i, "size", i);
    },
    has(i) {
      const r = this.__v_raw, o = qe(r), a = qe(i);
      return e || (En(i, a) && wt(o, "has", i), wt(o, "has", a)), i === a ? r.has(i) : r.has(i) || r.has(a);
    },
    forEach(i, r) {
      const o = this, a = o.__v_raw, l = qe(a), h = t ? Mr : e ? Si : bt;
      return !e && wt(l, "iterate", Wn), a.forEach((c, w) => i.call(r, h(c), h(w), o));
    }
  };
  return xt(
    n,
    e ? {
      add: ri("add"),
      set: ri("set"),
      delete: ri("delete"),
      clear: ri("clear")
    } : {
      add(i) {
        !t && !Kt(i) && !In(i) && (i = qe(i));
        const r = qe(this);
        return ii(r).has.call(r, i) || (r.add(i), mn(r, "add", i, i)), this;
      },
      set(i, r) {
        !t && !Kt(r) && !In(r) && (r = qe(r));
        const o = qe(this), { has: a, get: l } = ii(o);
        let h = a.call(o, i);
        h || (i = qe(i), h = a.call(o, i));
        const c = l.call(o, i);
        return o.set(i, r), h ? En(r, c) && mn(o, "set", i, r) : mn(o, "add", i, r), this;
      },
      delete(i) {
        const r = qe(this), { has: o, get: a } = ii(r);
        let l = o.call(r, i);
        l || (i = qe(i), l = o.call(r, i)), a && a.call(r, i);
        const h = r.delete(i);
        return l && mn(r, "delete", i, void 0), h;
      },
      clear() {
        const i = qe(this), r = i.size !== 0, o = i.clear();
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
    n[i] = Fu(i, e, t);
  }), n;
}
function oo(e, t) {
  const n = Du(e, t);
  return (s, i, r) => i === "__v_isReactive" ? !e : i === "__v_isReadonly" ? e : i === "__v_raw" ? s : Reflect.get(
    We(n, i) && i in s ? n : s,
    i,
    r
  );
}
const Bu = {
  get: /* @__PURE__ */ oo(!1, !1)
}, $u = {
  get: /* @__PURE__ */ oo(!1, !0)
}, Uu = {
  get: /* @__PURE__ */ oo(!0, !1)
};
const wl = /* @__PURE__ */ new WeakMap(), kl = /* @__PURE__ */ new WeakMap(), xl = /* @__PURE__ */ new WeakMap(), zu = /* @__PURE__ */ new WeakMap();
function Hu(e) {
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
function qu(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : Hu(gu(e));
}
function Hi(e) {
  return In(e) ? e : ao(
    e,
    !1,
    Pu,
    Bu,
    wl
  );
}
function Wu(e) {
  return ao(
    e,
    !1,
    Nu,
    $u,
    kl
  );
}
function Al(e) {
  return ao(
    e,
    !0,
    Mu,
    Uu,
    xl
  );
}
function ao(e, t, n, s, i) {
  if (!at(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const r = qu(e);
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
  return In(e) ? is(e.__v_raw) : !!(e && e.__v_isReactive);
}
function In(e) {
  return !!(e && e.__v_isReadonly);
}
function Kt(e) {
  return !!(e && e.__v_isShallow);
}
function lo(e) {
  return e ? !!e.__v_raw : !1;
}
function qe(e) {
  const t = e && e.__v_raw;
  return t ? qe(t) : e;
}
function ju(e) {
  return !We(e, "__v_skip") && Object.isExtensible(e) && Rr(e, "__v_skip", !0), e;
}
const bt = (e) => at(e) ? Hi(e) : e, Si = (e) => at(e) ? Al(e) : e;
function kt(e) {
  return e ? e.__v_isRef === !0 : !1;
}
function oe(e) {
  return Vu(e, !1);
}
function Vu(e, t) {
  return kt(e) ? e : new Ku(e, t);
}
class Ku {
  constructor(t, n) {
    this.dep = new ro(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : qe(t), this._value = n ? t : bt(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || Kt(t) || In(t);
    t = s ? t : qe(t), En(t, n) && (this._rawValue = t, this._value = s ? t : bt(t), this.dep.trigger());
  }
}
function E(e) {
  return kt(e) ? e.value : e;
}
const Gu = {
  get: (e, t, n) => t === "__v_raw" ? e : E(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const i = e[t];
    return kt(i) && !kt(n) ? (i.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function Tl(e) {
  return is(e) ? e : new Proxy(e, Gu);
}
class Yu {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new ro(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Us - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    it !== this)
      return hl(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return gl(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
function Xu(e, t, n = !1) {
  let s, i;
  return ye(e) ? s = e : (s = e.get, i = e.set), new Yu(s, i, n);
}
const oi = {}, Ei = /* @__PURE__ */ new WeakMap();
let Hn;
function Zu(e, t = !1, n = Hn) {
  if (n) {
    let s = Ei.get(n);
    s || Ei.set(n, s = []), s.push(e);
  }
}
function Ju(e, t, n = et) {
  const { immediate: s, deep: i, once: r, scheduler: o, augmentJob: a, call: l } = n, h = (k) => i ? k : Kt(k) || i === !1 || i === 0 ? _n(k, 1) : _n(k);
  let c, w, _, P, M = !1, K = !1;
  if (kt(e) ? (w = () => e.value, M = Kt(e)) : is(e) ? (w = () => h(e), M = !0) : pe(e) ? (K = !0, M = e.some((k) => is(k) || Kt(k)), w = () => e.map((k) => {
    if (kt(k))
      return k.value;
    if (is(k))
      return h(k);
    if (ye(k))
      return l ? l(k, 2) : k();
  })) : ye(e) ? t ? w = l ? () => l(e, 2) : e : w = () => {
    if (_) {
      bn();
      try {
        _();
      } finally {
        wn();
      }
    }
    const k = Hn;
    Hn = c;
    try {
      return l ? l(e, 3, [P]) : e(P);
    } finally {
      Hn = k;
    }
  } : w = an, t && i) {
    const k = w, N = i === !0 ? 1 / 0 : i;
    w = () => _n(k(), N);
  }
  const Me = Tu(), fe = () => {
    c.stop(), Me && Me.active && eo(Me.effects, c);
  };
  if (r && t) {
    const k = t;
    t = (...N) => {
      k(...N), fe();
    };
  }
  let _e = K ? new Array(e.length).fill(oi) : oi;
  const be = (k) => {
    if (!(!(c.flags & 1) || !c.dirty && !k))
      if (t) {
        const N = c.run();
        if (i || M || (K ? N.some((j, V) => En(j, _e[V])) : En(N, _e))) {
          _ && _();
          const j = Hn;
          Hn = c;
          try {
            const V = [
              N,
              // pass undefined as the old value when it's changed for the first time
              _e === oi ? void 0 : K && _e[0] === oi ? [] : _e,
              P
            ];
            _e = N, l ? l(t, 3, V) : (
              // @ts-expect-error
              t(...V)
            );
          } finally {
            Hn = j;
          }
        }
      } else
        c.run();
  };
  return a && a(be), c = new ul(w), c.scheduler = o ? () => o(be, !1) : be, P = (k) => Zu(k, !1, c), _ = c.onStop = () => {
    const k = Ei.get(c);
    if (k) {
      if (l)
        l(k, 4);
      else
        for (const N of k) N();
      Ei.delete(c);
    }
  }, t ? s ? be(!0) : _e = c.run() : o ? o(be.bind(null, !0), !0) : c.run(), fe.pause = c.pause.bind(c), fe.resume = c.resume.bind(c), fe.stop = fe, fe;
}
function _n(e, t = 1 / 0, n) {
  if (t <= 0 || !at(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Set(), n.has(e)))
    return e;
  if (n.add(e), t--, kt(e))
    _n(e.value, t, n);
  else if (pe(e))
    for (let s = 0; s < e.length; s++)
      _n(e[s], t, n);
  else if (nl(e) || ss(e))
    e.forEach((s) => {
      _n(s, t, n);
    });
  else if (rl(e)) {
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
function Vs(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (i) {
    qi(i, t, n);
  }
}
function un(e, t, n, s) {
  if (ye(e)) {
    const i = Vs(e, t, n, s);
    return i && sl(i) && i.catch((r) => {
      qi(r, t, n);
    }), i;
  }
  if (pe(e)) {
    const i = [];
    for (let r = 0; r < e.length; r++)
      i.push(un(e[r], t, n, s));
    return i;
  }
}
function qi(e, t, n, s = !0) {
  const i = t ? t.vnode : null, { errorHandler: r, throwUnhandledErrorInProduction: o } = t && t.appContext.config || et;
  if (t) {
    let a = t.parent;
    const l = t.proxy, h = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; a; ) {
      const c = a.ec;
      if (c) {
        for (let w = 0; w < c.length; w++)
          if (c[w](e, l, h) === !1)
            return;
      }
      a = a.parent;
    }
    if (r) {
      bn(), Vs(r, null, 10, [
        e,
        l,
        h
      ]), wn();
      return;
    }
  }
  Qu(e, n, i, s, o);
}
function Qu(e, t, n, s = !0, i = !1) {
  if (i)
    throw e;
  console.error(e);
}
const Et = [];
let rn = -1;
const rs = [];
let Tn = null, es = 0;
const Sl = /* @__PURE__ */ Promise.resolve();
let Ci = null;
function os(e) {
  const t = Ci || Sl;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function ef(e) {
  let t = rn + 1, n = Et.length;
  for (; t < n; ) {
    const s = t + n >>> 1, i = Et[s], r = Hs(i);
    r < e || r === e && i.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function co(e) {
  if (!(e.flags & 1)) {
    const t = Hs(e), n = Et[Et.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= Hs(n) ? Et.push(e) : Et.splice(ef(t), 0, e), e.flags |= 1, El();
  }
}
function El() {
  Ci || (Ci = Sl.then(Rl));
}
function tf(e) {
  pe(e) ? rs.push(...e) : Tn && e.id === -1 ? Tn.splice(es + 1, 0, e) : e.flags & 1 || (rs.push(e), e.flags |= 1), El();
}
function ia(e, t, n = rn + 1) {
  for (; n < Et.length; n++) {
    const s = Et[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid)
        continue;
      Et.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function Cl(e) {
  if (rs.length) {
    const t = [...new Set(rs)].sort(
      (n, s) => Hs(n) - Hs(s)
    );
    if (rs.length = 0, Tn) {
      Tn.push(...t);
      return;
    }
    for (Tn = t, es = 0; es < Tn.length; es++) {
      const n = Tn[es];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    Tn = null, es = 0;
  }
}
const Hs = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function Rl(e) {
  try {
    for (rn = 0; rn < Et.length; rn++) {
      const t = Et[rn];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), Vs(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; rn < Et.length; rn++) {
      const t = Et[rn];
      t && (t.flags &= -2);
    }
    rn = -1, Et.length = 0, Cl(), Ci = null, (Et.length || rs.length) && Rl();
  }
}
let Vt = null, Il = null;
function Ri(e) {
  const t = Vt;
  return Vt = e, Il = e && e.type.__scopeId || null, t;
}
function nf(e, t = Vt, n) {
  if (!t || e._n)
    return e;
  const s = (...i) => {
    s._d && da(-1);
    const r = Ri(t);
    let o;
    try {
      o = e(...i);
    } finally {
      Ri(r), s._d && da(1);
    }
    return o;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function An(e, t) {
  if (Vt === null)
    return e;
  const n = Gi(Vt), s = e.dirs || (e.dirs = []);
  for (let i = 0; i < t.length; i++) {
    let [r, o, a, l = et] = t[i];
    r && (ye(r) && (r = {
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
function Bn(e, t, n, s) {
  const i = e.dirs, r = t && t.dirs;
  for (let o = 0; o < i.length; o++) {
    const a = i[o];
    r && (a.oldValue = r[o].value);
    let l = a.dir[s];
    l && (bn(), un(l, n, 8, [
      e.el,
      a,
      e,
      t
    ]), wn());
  }
}
const sf = Symbol("_vte"), rf = (e) => e.__isTeleport;
function uo(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, uo(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function Ll(e, t) {
  return ye(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    xt({ name: e.name }, t, { setup: e })
  ) : e;
}
function Ol(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function Ns(e, t, n, s, i = !1) {
  if (pe(e)) {
    e.forEach(
      (M, K) => Ns(
        M,
        t && (pe(t) ? t[K] : t),
        n,
        s,
        i
      )
    );
    return;
  }
  if (Fs(s) && !i) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Ns(e, t, n, s.component.subTree);
    return;
  }
  const r = s.shapeFlag & 4 ? Gi(s.component) : s.el, o = i ? null : r, { i: a, r: l } = e, h = t && t.r, c = a.refs === et ? a.refs = {} : a.refs, w = a.setupState, _ = qe(w), P = w === et ? () => !1 : (M) => We(_, M);
  if (h != null && h !== l && (pt(h) ? (c[h] = null, P(h) && (w[h] = null)) : kt(h) && (h.value = null)), ye(l))
    Vs(l, a, 12, [o, c]);
  else {
    const M = pt(l), K = kt(l);
    if (M || K) {
      const Me = () => {
        if (e.f) {
          const fe = M ? P(l) ? w[l] : c[l] : l.value;
          i ? pe(fe) && eo(fe, r) : pe(fe) ? fe.includes(r) || fe.push(r) : M ? (c[l] = [r], P(l) && (w[l] = c[l])) : (l.value = [r], e.k && (c[e.k] = l.value));
        } else M ? (c[l] = o, P(l) && (w[l] = o)) : K && (l.value = o, e.k && (c[e.k] = o));
      };
      o ? (Me.id = -1, Dt(Me, n)) : Me();
    }
  }
}
Ui().requestIdleCallback;
Ui().cancelIdleCallback;
const Fs = (e) => !!e.type.__asyncLoader, Pl = (e) => e.type.__isKeepAlive;
function of(e, t) {
  Ml(e, "a", t);
}
function af(e, t) {
  Ml(e, "da", t);
}
function Ml(e, t, n = Ct) {
  const s = e.__wdc || (e.__wdc = () => {
    let i = n;
    for (; i; ) {
      if (i.isDeactivated)
        return;
      i = i.parent;
    }
    return e();
  });
  if (Wi(t, s, n), n) {
    let i = n.parent;
    for (; i && i.parent; )
      Pl(i.parent.vnode) && lf(s, t, n, i), i = i.parent;
  }
}
function lf(e, t, n, s) {
  const i = Wi(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  Ks(() => {
    eo(s[t], i);
  }, n);
}
function Wi(e, t, n = Ct, s = !1) {
  if (n) {
    const i = n[e] || (n[e] = []), r = t.__weh || (t.__weh = (...o) => {
      bn();
      const a = Gs(n), l = un(t, n, e, o);
      return a(), wn(), l;
    });
    return s ? i.unshift(r) : i.push(r), r;
  }
}
const kn = (e) => (t, n = Ct) => {
  (!Ws || e === "sp") && Wi(e, (...s) => t(...s), n);
}, cf = kn("bm"), ji = kn("m"), uf = kn(
  "bu"
), ff = kn("u"), Nl = kn(
  "bum"
), Ks = kn("um"), hf = kn(
  "sp"
), df = kn("rtg"), pf = kn("rtc");
function gf(e, t = Ct) {
  Wi("ec", e, t);
}
const mf = Symbol.for("v-ndc");
function vt(e, t, n, s) {
  let i;
  const r = n, o = pe(e);
  if (o || pt(e)) {
    const a = o && is(e);
    let l = !1, h = !1;
    a && (l = !Kt(e), h = In(e), e = zi(e)), i = new Array(e.length);
    for (let c = 0, w = e.length; c < w; c++)
      i[c] = t(
        l ? h ? Si(bt(e[c])) : bt(e[c]) : e[c],
        c,
        void 0,
        r
      );
  } else if (typeof e == "number") {
    i = new Array(e);
    for (let a = 0; a < e; a++)
      i[a] = t(a + 1, a, void 0, r);
  } else if (at(e))
    if (e[Symbol.iterator])
      i = Array.from(
        e,
        (a, l) => t(a, l, void 0, r)
      );
    else {
      const a = Object.keys(e);
      i = new Array(a.length);
      for (let l = 0, h = a.length; l < h; l++) {
        const c = a[l];
        i[l] = t(e[c], c, l, r);
      }
    }
  else
    i = [];
  return i;
}
const Nr = (e) => e ? sc(e) ? Gi(e) : Nr(e.parent) : null, Ds = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ xt(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => Nr(e.parent),
    $root: (e) => Nr(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Dl(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      co(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = os.bind(e.proxy)),
    $watch: (e) => Bf.bind(e)
  })
), pr = (e, t) => e !== et && !e.__isScriptSetup && We(e, t), _f = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: i, props: r, accessCache: o, type: a, appContext: l } = e;
    let h;
    if (t[0] !== "$") {
      const P = o[t];
      if (P !== void 0)
        switch (P) {
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
        if (pr(s, t))
          return o[t] = 1, s[t];
        if (i !== et && We(i, t))
          return o[t] = 2, i[t];
        if (
          // only cache other properties when instance has declared (thus stable)
          // props
          (h = e.propsOptions[0]) && We(h, t)
        )
          return o[t] = 3, r[t];
        if (n !== et && We(n, t))
          return o[t] = 4, n[t];
        Fr && (o[t] = 0);
      }
    }
    const c = Ds[t];
    let w, _;
    if (c)
      return t === "$attrs" && wt(e.attrs, "get", ""), c(e);
    if (
      // css module (injected by vue-loader)
      (w = a.__cssModules) && (w = w[t])
    )
      return w;
    if (n !== et && We(n, t))
      return o[t] = 4, n[t];
    if (
      // global properties
      _ = l.config.globalProperties, We(_, t)
    )
      return _[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: i, ctx: r } = e;
    return pr(i, t) ? (i[t] = n, !0) : s !== et && We(s, t) ? (s[t] = n, !0) : We(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (r[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: i, propsOptions: r }
  }, o) {
    let a;
    return !!n[o] || e !== et && We(e, o) || pr(t, o) || (a = r[0]) && We(a, o) || We(s, o) || We(Ds, o) || We(i.config.globalProperties, o);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : We(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function ra(e) {
  return pe(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let Fr = !0;
function yf(e) {
  const t = Dl(e), n = e.proxy, s = e.ctx;
  Fr = !1, t.beforeCreate && oa(t.beforeCreate, e, "bc");
  const {
    // state
    data: i,
    computed: r,
    methods: o,
    watch: a,
    provide: l,
    inject: h,
    // lifecycle
    created: c,
    beforeMount: w,
    mounted: _,
    beforeUpdate: P,
    updated: M,
    activated: K,
    deactivated: Me,
    beforeDestroy: fe,
    beforeUnmount: _e,
    destroyed: be,
    unmounted: k,
    render: N,
    renderTracked: j,
    renderTriggered: V,
    errorCaptured: Ae,
    serverPrefetch: Ne,
    // public API
    expose: tt,
    inheritAttrs: Ce,
    // assets
    components: ve,
    directives: Ge,
    filters: nt
  } = t;
  if (h && vf(h, s, null), o)
    for (const ge in o) {
      const ee = o[ge];
      ye(ee) && (s[ge] = ee.bind(n));
    }
  if (i) {
    const ge = i.call(n, n);
    at(ge) && (e.data = Hi(ge));
  }
  if (Fr = !0, r)
    for (const ge in r) {
      const ee = r[ge], ot = ye(ee) ? ee.bind(n, n) : ye(ee.get) ? ee.get.bind(n, n) : an, Re = !ye(ee) && ye(ee.set) ? ee.set.bind(n) : an, de = ue({
        get: ot,
        set: Re
      });
      Object.defineProperty(s, ge, {
        enumerable: !0,
        configurable: !0,
        get: () => de.value,
        set: (Ye) => de.value = Ye
      });
    }
  if (a)
    for (const ge in a)
      Fl(a[ge], s, n, ge);
  if (l) {
    const ge = ye(l) ? l.call(n) : l;
    Reflect.ownKeys(ge).forEach((ee) => {
      Tf(ee, ge[ee]);
    });
  }
  c && oa(c, e, "c");
  function le(ge, ee) {
    pe(ee) ? ee.forEach((ot) => ge(ot.bind(n))) : ee && ge(ee.bind(n));
  }
  if (le(cf, w), le(ji, _), le(uf, P), le(ff, M), le(of, K), le(af, Me), le(gf, Ae), le(pf, j), le(df, V), le(Nl, _e), le(Ks, k), le(hf, Ne), pe(tt))
    if (tt.length) {
      const ge = e.exposed || (e.exposed = {});
      tt.forEach((ee) => {
        Object.defineProperty(ge, ee, {
          get: () => n[ee],
          set: (ot) => n[ee] = ot,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  N && e.render === an && (e.render = N), Ce != null && (e.inheritAttrs = Ce), ve && (e.components = ve), Ge && (e.directives = Ge), Ne && Ol(e);
}
function vf(e, t, n = an) {
  pe(e) && (e = Dr(e));
  for (const s in e) {
    const i = e[s];
    let r;
    at(i) ? "default" in i ? r = di(
      i.from || s,
      i.default,
      !0
    ) : r = di(i.from || s) : r = di(i), kt(r) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => r.value,
      set: (o) => r.value = o
    }) : t[s] = r;
  }
}
function oa(e, t, n) {
  un(
    pe(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function Fl(e, t, n, s) {
  let i = s.includes(".") ? Xl(n, s) : () => n[s];
  if (pt(e)) {
    const r = t[e];
    ye(r) && jt(i, r);
  } else if (ye(e))
    jt(i, e.bind(n));
  else if (at(e))
    if (pe(e))
      e.forEach((r) => Fl(r, t, n, s));
    else {
      const r = ye(e.handler) ? e.handler.bind(n) : t[e.handler];
      ye(r) && jt(i, r, e);
    }
}
function Dl(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: i,
    optionsCache: r,
    config: { optionMergeStrategies: o }
  } = e.appContext, a = r.get(t);
  let l;
  return a ? l = a : !i.length && !n && !s ? l = t : (l = {}, i.length && i.forEach(
    (h) => Ii(l, h, o, !0)
  ), Ii(l, t, o)), at(t) && r.set(t, l), l;
}
function Ii(e, t, n, s = !1) {
  const { mixins: i, extends: r } = t;
  r && Ii(e, r, n, !0), i && i.forEach(
    (o) => Ii(e, o, n, !0)
  );
  for (const o in t)
    if (!(s && o === "expose")) {
      const a = bf[o] || n && n[o];
      e[o] = a ? a(e[o], t[o]) : t[o];
    }
  return e;
}
const bf = {
  data: aa,
  props: la,
  emits: la,
  // objects
  methods: Rs,
  computed: Rs,
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
  components: Rs,
  directives: Rs,
  // watch
  watch: kf,
  // provide / inject
  provide: aa,
  inject: wf
};
function aa(e, t) {
  return t ? e ? function() {
    return xt(
      ye(e) ? e.call(this, this) : e,
      ye(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function wf(e, t) {
  return Rs(Dr(e), Dr(t));
}
function Dr(e) {
  if (pe(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function St(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function Rs(e, t) {
  return e ? xt(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function la(e, t) {
  return e ? pe(e) && pe(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : xt(
    /* @__PURE__ */ Object.create(null),
    ra(e),
    ra(t ?? {})
  ) : t;
}
function kf(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = xt(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = St(e[s], t[s]);
  return n;
}
function Bl() {
  return {
    app: null,
    config: {
      isNativeTag: du,
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
let xf = 0;
function Af(e, t) {
  return function(s, i = null) {
    ye(s) || (s = xt({}, s)), i != null && !at(i) && (i = null);
    const r = Bl(), o = /* @__PURE__ */ new WeakSet(), a = [];
    let l = !1;
    const h = r.app = {
      _uid: xf++,
      _component: s,
      _props: i,
      _container: null,
      _context: r,
      _instance: null,
      version: rh,
      get config() {
        return r.config;
      },
      set config(c) {
      },
      use(c, ...w) {
        return o.has(c) || (c && ye(c.install) ? (o.add(c), c.install(h, ...w)) : ye(c) && (o.add(c), c(h, ...w))), h;
      },
      mixin(c) {
        return r.mixins.includes(c) || r.mixins.push(c), h;
      },
      component(c, w) {
        return w ? (r.components[c] = w, h) : r.components[c];
      },
      directive(c, w) {
        return w ? (r.directives[c] = w, h) : r.directives[c];
      },
      mount(c, w, _) {
        if (!l) {
          const P = h._ceVNode || ln(s, i);
          return P.appContext = r, _ === !0 ? _ = "svg" : _ === !1 && (_ = void 0), e(P, c, _), l = !0, h._container = c, c.__vue_app__ = h, Gi(P.component);
        }
      },
      onUnmount(c) {
        a.push(c);
      },
      unmount() {
        l && (un(
          a,
          h._instance,
          16
        ), e(null, h._container), delete h._container.__vue_app__);
      },
      provide(c, w) {
        return r.provides[c] = w, h;
      },
      runWithContext(c) {
        const w = as;
        as = h;
        try {
          return c();
        } finally {
          as = w;
        }
      }
    };
    return h;
  };
}
let as = null;
function Tf(e, t) {
  if (Ct) {
    let n = Ct.provides;
    const s = Ct.parent && Ct.parent.provides;
    s === n && (n = Ct.provides = Object.create(s)), n[e] = t;
  }
}
function di(e, t, n = !1) {
  const s = Qf();
  if (s || as) {
    let i = as ? as._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (i && e in i)
      return i[e];
    if (arguments.length > 1)
      return n && ye(t) ? t.call(s && s.proxy) : t;
  }
}
const $l = {}, Ul = () => Object.create($l), zl = (e) => Object.getPrototypeOf(e) === $l;
function Sf(e, t, n, s = !1) {
  const i = {}, r = Ul();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Hl(e, t, i, r);
  for (const o in e.propsOptions[0])
    o in i || (i[o] = void 0);
  n ? e.props = s ? i : Wu(i) : e.type.props ? e.props = i : e.props = r, e.attrs = r;
}
function Ef(e, t, n, s) {
  const {
    props: i,
    attrs: r,
    vnode: { patchFlag: o }
  } = e, a = qe(i), [l] = e.propsOptions;
  let h = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (s || o > 0) && !(o & 16)
  ) {
    if (o & 8) {
      const c = e.vnode.dynamicProps;
      for (let w = 0; w < c.length; w++) {
        let _ = c[w];
        if (Vi(e.emitsOptions, _))
          continue;
        const P = t[_];
        if (l)
          if (We(r, _))
            P !== r[_] && (r[_] = P, h = !0);
          else {
            const M = Rn(_);
            i[M] = Br(
              l,
              a,
              M,
              P,
              e,
              !1
            );
          }
        else
          P !== r[_] && (r[_] = P, h = !0);
      }
    }
  } else {
    Hl(e, t, i, r) && (h = !0);
    let c;
    for (const w in a)
      (!t || // for camelCase
      !We(t, w) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((c = Pn(w)) === w || !We(t, c))) && (l ? n && // for camelCase
      (n[w] !== void 0 || // for kebab-case
      n[c] !== void 0) && (i[w] = Br(
        l,
        a,
        w,
        void 0,
        e,
        !0
      )) : delete i[w]);
    if (r !== a)
      for (const w in r)
        (!t || !We(t, w)) && (delete r[w], h = !0);
  }
  h && mn(e.attrs, "set", "");
}
function Hl(e, t, n, s) {
  const [i, r] = e.propsOptions;
  let o = !1, a;
  if (t)
    for (let l in t) {
      if (Os(l))
        continue;
      const h = t[l];
      let c;
      i && We(i, c = Rn(l)) ? !r || !r.includes(c) ? n[c] = h : (a || (a = {}))[c] = h : Vi(e.emitsOptions, l) || (!(l in s) || h !== s[l]) && (s[l] = h, o = !0);
    }
  if (r) {
    const l = qe(n), h = a || et;
    for (let c = 0; c < r.length; c++) {
      const w = r[c];
      n[w] = Br(
        i,
        l,
        w,
        h[w],
        e,
        !We(h, w)
      );
    }
  }
  return o;
}
function Br(e, t, n, s, i, r) {
  const o = e[n];
  if (o != null) {
    const a = We(o, "default");
    if (a && s === void 0) {
      const l = o.default;
      if (o.type !== Function && !o.skipFactory && ye(l)) {
        const { propsDefaults: h } = i;
        if (n in h)
          s = h[n];
        else {
          const c = Gs(i);
          s = h[n] = l.call(
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
    ] && (s === "" || s === Pn(n)) && (s = !0));
  }
  return s;
}
const Cf = /* @__PURE__ */ new WeakMap();
function ql(e, t, n = !1) {
  const s = n ? Cf : t.propsCache, i = s.get(e);
  if (i)
    return i;
  const r = e.props, o = {}, a = [];
  let l = !1;
  if (!ye(e)) {
    const c = (w) => {
      l = !0;
      const [_, P] = ql(w, t, !0);
      xt(o, _), P && a.push(...P);
    };
    !n && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  if (!r && !l)
    return at(e) && s.set(e, ns), ns;
  if (pe(r))
    for (let c = 0; c < r.length; c++) {
      const w = Rn(r[c]);
      ca(w) && (o[w] = et);
    }
  else if (r)
    for (const c in r) {
      const w = Rn(c);
      if (ca(w)) {
        const _ = r[c], P = o[w] = pe(_) || ye(_) ? { type: _ } : xt({}, _), M = P.type;
        let K = !1, Me = !0;
        if (pe(M))
          for (let fe = 0; fe < M.length; ++fe) {
            const _e = M[fe], be = ye(_e) && _e.name;
            if (be === "Boolean") {
              K = !0;
              break;
            } else be === "String" && (Me = !1);
          }
        else
          K = ye(M) && M.name === "Boolean";
        P[
          0
          /* shouldCast */
        ] = K, P[
          1
          /* shouldCastTrue */
        ] = Me, (K || We(P, "default")) && a.push(w);
      }
    }
  const h = [o, a];
  return at(e) && s.set(e, h), h;
}
function ca(e) {
  return e[0] !== "$" && !Os(e);
}
const fo = (e) => e === "_" || e === "__" || e === "_ctx" || e === "$stable", ho = (e) => pe(e) ? e.map(on) : [on(e)], Rf = (e, t, n) => {
  if (t._n)
    return t;
  const s = nf((...i) => ho(t(...i)), n);
  return s._c = !1, s;
}, Wl = (e, t, n) => {
  const s = e._ctx;
  for (const i in e) {
    if (fo(i)) continue;
    const r = e[i];
    if (ye(r))
      t[i] = Rf(i, r, s);
    else if (r != null) {
      const o = ho(r);
      t[i] = () => o;
    }
  }
}, jl = (e, t) => {
  const n = ho(t);
  e.slots.default = () => n;
}, Vl = (e, t, n) => {
  for (const s in t)
    (n || !fo(s)) && (e[s] = t[s]);
}, If = (e, t, n) => {
  const s = e.slots = Ul();
  if (e.vnode.shapeFlag & 32) {
    const i = t.__;
    i && Rr(s, "__", i, !0);
    const r = t._;
    r ? (Vl(s, t, n), n && Rr(s, "_", r, !0)) : Wl(t, s);
  } else t && jl(e, t);
}, Lf = (e, t, n) => {
  const { vnode: s, slots: i } = e;
  let r = !0, o = et;
  if (s.shapeFlag & 32) {
    const a = t._;
    a ? n && a === 1 ? r = !1 : Vl(i, t, n) : (r = !t.$stable, Wl(t, i)), o = t;
  } else t && (jl(e, t), o = { default: 1 });
  if (r)
    for (const a in i)
      !fo(a) && o[a] == null && delete i[a];
}, Dt = jf;
function Of(e) {
  return Pf(e);
}
function Pf(e, t) {
  const n = Ui();
  n.__VUE__ = !0;
  const {
    insert: s,
    remove: i,
    patchProp: r,
    createElement: o,
    createText: a,
    createComment: l,
    setText: h,
    setElementText: c,
    parentNode: w,
    nextSibling: _,
    setScopeId: P = an,
    insertStaticContent: M
  } = e, K = (g, y, A, I = null, L = null, R = null, z = void 0, $ = null, U = !!y.dynamicChildren) => {
    if (g === y)
      return;
    g && !_s(g, y) && (I = Fe(g), Ye(g, L, R, !0), g = null), y.patchFlag === -2 && (U = !1, y.dynamicChildren = null);
    const { type: F, ref: J, shapeFlag: H } = y;
    switch (F) {
      case Ki:
        Me(g, y, A, I);
        break;
      case Ln:
        fe(g, y, A, I);
        break;
      case pi:
        g == null && _e(y, A, I, z);
        break;
      case Be:
        ve(
          g,
          y,
          A,
          I,
          L,
          R,
          z,
          $,
          U
        );
        break;
      default:
        H & 1 ? N(
          g,
          y,
          A,
          I,
          L,
          R,
          z,
          $,
          U
        ) : H & 6 ? Ge(
          g,
          y,
          A,
          I,
          L,
          R,
          z,
          $,
          U
        ) : (H & 64 || H & 128) && F.process(
          g,
          y,
          A,
          I,
          L,
          R,
          z,
          $,
          U,
          ct
        );
    }
    J != null && L ? Ns(J, g && g.ref, R, y || g, !y) : J == null && g && g.ref != null && Ns(g.ref, null, R, g, !0);
  }, Me = (g, y, A, I) => {
    if (g == null)
      s(
        y.el = a(y.children),
        A,
        I
      );
    else {
      const L = y.el = g.el;
      y.children !== g.children && h(L, y.children);
    }
  }, fe = (g, y, A, I) => {
    g == null ? s(
      y.el = l(y.children || ""),
      A,
      I
    ) : y.el = g.el;
  }, _e = (g, y, A, I) => {
    [g.el, g.anchor] = M(
      g.children,
      y,
      A,
      I,
      g.el,
      g.anchor
    );
  }, be = ({ el: g, anchor: y }, A, I) => {
    let L;
    for (; g && g !== y; )
      L = _(g), s(g, A, I), g = L;
    s(y, A, I);
  }, k = ({ el: g, anchor: y }) => {
    let A;
    for (; g && g !== y; )
      A = _(g), i(g), g = A;
    i(y);
  }, N = (g, y, A, I, L, R, z, $, U) => {
    y.type === "svg" ? z = "svg" : y.type === "math" && (z = "mathml"), g == null ? j(
      y,
      A,
      I,
      L,
      R,
      z,
      $,
      U
    ) : Ne(
      g,
      y,
      L,
      R,
      z,
      $,
      U
    );
  }, j = (g, y, A, I, L, R, z, $) => {
    let U, F;
    const { props: J, shapeFlag: H, transition: Y, dirs: Q } = g;
    if (U = g.el = o(
      g.type,
      R,
      J && J.is,
      J
    ), H & 8 ? c(U, g.children) : H & 16 && Ae(
      g.children,
      U,
      null,
      I,
      L,
      gr(g, R),
      z,
      $
    ), Q && Bn(g, null, I, "created"), V(U, g, g.scopeId, z, I), J) {
      for (const Pe in J)
        Pe !== "value" && !Os(Pe) && r(U, Pe, null, J[Pe], R, I);
      "value" in J && r(U, "value", null, J.value, R), (F = J.onVnodeBeforeMount) && nn(F, I, g);
    }
    Q && Bn(g, null, I, "beforeMount");
    const ie = Mf(L, Y);
    ie && Y.beforeEnter(U), s(U, y, A), ((F = J && J.onVnodeMounted) || ie || Q) && Dt(() => {
      F && nn(F, I, g), ie && Y.enter(U), Q && Bn(g, null, I, "mounted");
    }, L);
  }, V = (g, y, A, I, L) => {
    if (A && P(g, A), I)
      for (let R = 0; R < I.length; R++)
        P(g, I[R]);
    if (L) {
      let R = L.subTree;
      if (y === R || Jl(R.type) && (R.ssContent === y || R.ssFallback === y)) {
        const z = L.vnode;
        V(
          g,
          z,
          z.scopeId,
          z.slotScopeIds,
          L.parent
        );
      }
    }
  }, Ae = (g, y, A, I, L, R, z, $, U = 0) => {
    for (let F = U; F < g.length; F++) {
      const J = g[F] = $ ? Sn(g[F]) : on(g[F]);
      K(
        null,
        J,
        y,
        A,
        I,
        L,
        R,
        z,
        $
      );
    }
  }, Ne = (g, y, A, I, L, R, z) => {
    const $ = y.el = g.el;
    let { patchFlag: U, dynamicChildren: F, dirs: J } = y;
    U |= g.patchFlag & 16;
    const H = g.props || et, Y = y.props || et;
    let Q;
    if (A && $n(A, !1), (Q = Y.onVnodeBeforeUpdate) && nn(Q, A, y, g), J && Bn(y, g, A, "beforeUpdate"), A && $n(A, !0), (H.innerHTML && Y.innerHTML == null || H.textContent && Y.textContent == null) && c($, ""), F ? tt(
      g.dynamicChildren,
      F,
      $,
      A,
      I,
      gr(y, L),
      R
    ) : z || ee(
      g,
      y,
      $,
      null,
      A,
      I,
      gr(y, L),
      R,
      !1
    ), U > 0) {
      if (U & 16)
        Ce($, H, Y, A, L);
      else if (U & 2 && H.class !== Y.class && r($, "class", null, Y.class, L), U & 4 && r($, "style", H.style, Y.style, L), U & 8) {
        const ie = y.dynamicProps;
        for (let Pe = 0; Pe < ie.length; Pe++) {
          const ce = ie[Pe], ut = H[ce], Ue = Y[ce];
          (Ue !== ut || ce === "value") && r($, ce, ut, Ue, L, A);
        }
      }
      U & 1 && g.children !== y.children && c($, y.children);
    } else !z && F == null && Ce($, H, Y, A, L);
    ((Q = Y.onVnodeUpdated) || J) && Dt(() => {
      Q && nn(Q, A, y, g), J && Bn(y, g, A, "updated");
    }, I);
  }, tt = (g, y, A, I, L, R, z) => {
    for (let $ = 0; $ < y.length; $++) {
      const U = g[$], F = y[$], J = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        U.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (U.type === Be || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !_s(U, F) || // - In the case of a component, it could contain anything.
        U.shapeFlag & 198) ? w(U.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          A
        )
      );
      K(
        U,
        F,
        J,
        null,
        I,
        L,
        R,
        z,
        !0
      );
    }
  }, Ce = (g, y, A, I, L) => {
    if (y !== A) {
      if (y !== et)
        for (const R in y)
          !Os(R) && !(R in A) && r(
            g,
            R,
            y[R],
            null,
            L,
            I
          );
      for (const R in A) {
        if (Os(R)) continue;
        const z = A[R], $ = y[R];
        z !== $ && R !== "value" && r(g, R, $, z, L, I);
      }
      "value" in A && r(g, "value", y.value, A.value, L);
    }
  }, ve = (g, y, A, I, L, R, z, $, U) => {
    const F = y.el = g ? g.el : a(""), J = y.anchor = g ? g.anchor : a("");
    let { patchFlag: H, dynamicChildren: Y, slotScopeIds: Q } = y;
    Q && ($ = $ ? $.concat(Q) : Q), g == null ? (s(F, A, I), s(J, A, I), Ae(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      y.children || [],
      A,
      J,
      L,
      R,
      z,
      $,
      U
    )) : H > 0 && H & 64 && Y && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    g.dynamicChildren ? (tt(
      g.dynamicChildren,
      Y,
      A,
      L,
      R,
      z,
      $
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (y.key != null || L && y === L.subTree) && Kl(
      g,
      y,
      !0
      /* shallow */
    )) : ee(
      g,
      y,
      A,
      J,
      L,
      R,
      z,
      $,
      U
    );
  }, Ge = (g, y, A, I, L, R, z, $, U) => {
    y.slotScopeIds = $, g == null ? y.shapeFlag & 512 ? L.ctx.activate(
      y,
      A,
      I,
      z,
      U
    ) : nt(
      y,
      A,
      I,
      L,
      R,
      z,
      U
    ) : lt(g, y, U);
  }, nt = (g, y, A, I, L, R, z) => {
    const $ = g.component = Jf(
      g,
      I,
      L
    );
    if (Pl(g) && ($.ctx.renderer = ct), eh($, !1, z), $.asyncDep) {
      if (L && L.registerDep($, le, z), !g.el) {
        const U = $.subTree = ln(Ln);
        fe(null, U, y, A), g.placeholder = U.el;
      }
    } else
      le(
        $,
        g,
        y,
        A,
        L,
        R,
        z
      );
  }, lt = (g, y, A) => {
    const I = y.component = g.component;
    if (qf(g, y, A))
      if (I.asyncDep && !I.asyncResolved) {
        ge(I, y, A);
        return;
      } else
        I.next = y, I.update();
    else
      y.el = g.el, I.vnode = y;
  }, le = (g, y, A, I, L, R, z) => {
    const $ = () => {
      if (g.isMounted) {
        let { next: H, bu: Y, u: Q, parent: ie, vnode: Pe } = g;
        {
          const f = Gl(g);
          if (f) {
            H && (H.el = Pe.el, ge(g, H, z)), f.asyncDep.then(() => {
              g.isUnmounted || $();
            });
            return;
          }
        }
        let ce = H, ut;
        $n(g, !1), H ? (H.el = Pe.el, ge(g, H, z)) : H = Pe, Y && hi(Y), (ut = H.props && H.props.onVnodeBeforeUpdate) && nn(ut, ie, H, Pe), $n(g, !0);
        const Ue = fa(g), st = g.subTree;
        g.subTree = Ue, K(
          st,
          Ue,
          // parent may have changed if it's in a teleport
          w(st.el),
          // anchor may have changed if it's in a fragment
          Fe(st),
          g,
          L,
          R
        ), H.el = Ue.el, ce === null && Wf(g, Ue.el), Q && Dt(Q, L), (ut = H.props && H.props.onVnodeUpdated) && Dt(
          () => nn(ut, ie, H, Pe),
          L
        );
      } else {
        let H;
        const { el: Y, props: Q } = y, { bm: ie, m: Pe, parent: ce, root: ut, type: Ue } = g, st = Fs(y);
        $n(g, !1), ie && hi(ie), !st && (H = Q && Q.onVnodeBeforeMount) && nn(H, ce, y), $n(g, !0);
        {
          ut.ce && // @ts-expect-error _def is private
          ut.ce._def.shadowRoot !== !1 && ut.ce._injectChildStyle(Ue);
          const f = g.subTree = fa(g);
          K(
            null,
            f,
            A,
            I,
            g,
            L,
            R
          ), y.el = f.el;
        }
        if (Pe && Dt(Pe, L), !st && (H = Q && Q.onVnodeMounted)) {
          const f = y;
          Dt(
            () => nn(H, ce, f),
            L
          );
        }
        (y.shapeFlag & 256 || ce && Fs(ce.vnode) && ce.vnode.shapeFlag & 256) && g.a && Dt(g.a, L), g.isMounted = !0, y = A = I = null;
      }
    };
    g.scope.on();
    const U = g.effect = new ul($);
    g.scope.off();
    const F = g.update = U.run.bind(U), J = g.job = U.runIfDirty.bind(U);
    J.i = g, J.id = g.uid, U.scheduler = () => co(J), $n(g, !0), F();
  }, ge = (g, y, A) => {
    y.component = g;
    const I = g.vnode.props;
    g.vnode = y, g.next = null, Ef(g, y.props, I, A), Lf(g, y.children, A), bn(), ia(g), wn();
  }, ee = (g, y, A, I, L, R, z, $, U = !1) => {
    const F = g && g.children, J = g ? g.shapeFlag : 0, H = y.children, { patchFlag: Y, shapeFlag: Q } = y;
    if (Y > 0) {
      if (Y & 128) {
        Re(
          F,
          H,
          A,
          I,
          L,
          R,
          z,
          $,
          U
        );
        return;
      } else if (Y & 256) {
        ot(
          F,
          H,
          A,
          I,
          L,
          R,
          z,
          $,
          U
        );
        return;
      }
    }
    Q & 8 ? (J & 16 && ae(F, L, R), H !== F && c(A, H)) : J & 16 ? Q & 16 ? Re(
      F,
      H,
      A,
      I,
      L,
      R,
      z,
      $,
      U
    ) : ae(F, L, R, !0) : (J & 8 && c(A, ""), Q & 16 && Ae(
      H,
      A,
      I,
      L,
      R,
      z,
      $,
      U
    ));
  }, ot = (g, y, A, I, L, R, z, $, U) => {
    g = g || ns, y = y || ns;
    const F = g.length, J = y.length, H = Math.min(F, J);
    let Y;
    for (Y = 0; Y < H; Y++) {
      const Q = y[Y] = U ? Sn(y[Y]) : on(y[Y]);
      K(
        g[Y],
        Q,
        A,
        null,
        L,
        R,
        z,
        $,
        U
      );
    }
    F > J ? ae(
      g,
      L,
      R,
      !0,
      !1,
      H
    ) : Ae(
      y,
      A,
      I,
      L,
      R,
      z,
      $,
      U,
      H
    );
  }, Re = (g, y, A, I, L, R, z, $, U) => {
    let F = 0;
    const J = y.length;
    let H = g.length - 1, Y = J - 1;
    for (; F <= H && F <= Y; ) {
      const Q = g[F], ie = y[F] = U ? Sn(y[F]) : on(y[F]);
      if (_s(Q, ie))
        K(
          Q,
          ie,
          A,
          null,
          L,
          R,
          z,
          $,
          U
        );
      else
        break;
      F++;
    }
    for (; F <= H && F <= Y; ) {
      const Q = g[H], ie = y[Y] = U ? Sn(y[Y]) : on(y[Y]);
      if (_s(Q, ie))
        K(
          Q,
          ie,
          A,
          null,
          L,
          R,
          z,
          $,
          U
        );
      else
        break;
      H--, Y--;
    }
    if (F > H) {
      if (F <= Y) {
        const Q = Y + 1, ie = Q < J ? y[Q].el : I;
        for (; F <= Y; )
          K(
            null,
            y[F] = U ? Sn(y[F]) : on(y[F]),
            A,
            ie,
            L,
            R,
            z,
            $,
            U
          ), F++;
      }
    } else if (F > Y)
      for (; F <= H; )
        Ye(g[F], L, R, !0), F++;
    else {
      const Q = F, ie = F, Pe = /* @__PURE__ */ new Map();
      for (F = ie; F <= Y; F++) {
        const S = y[F] = U ? Sn(y[F]) : on(y[F]);
        S.key != null && Pe.set(S.key, F);
      }
      let ce, ut = 0;
      const Ue = Y - ie + 1;
      let st = !1, f = 0;
      const v = new Array(Ue);
      for (F = 0; F < Ue; F++) v[F] = 0;
      for (F = Q; F <= H; F++) {
        const S = g[F];
        if (ut >= Ue) {
          Ye(S, L, R, !0);
          continue;
        }
        let D;
        if (S.key != null)
          D = Pe.get(S.key);
        else
          for (ce = ie; ce <= Y; ce++)
            if (v[ce - ie] === 0 && _s(S, y[ce])) {
              D = ce;
              break;
            }
        D === void 0 ? Ye(S, L, R, !0) : (v[D - ie] = F + 1, D >= f ? f = D : st = !0, K(
          S,
          y[D],
          A,
          null,
          L,
          R,
          z,
          $,
          U
        ), ut++);
      }
      const C = st ? Nf(v) : ns;
      for (ce = C.length - 1, F = Ue - 1; F >= 0; F--) {
        const S = ie + F, D = y[S], X = y[S + 1], se = S + 1 < J ? (
          // #13559, fallback to el placeholder for unresolved async component
          X.el || X.placeholder
        ) : I;
        v[F] === 0 ? K(
          null,
          D,
          A,
          se,
          L,
          R,
          z,
          $,
          U
        ) : st && (ce < 0 || F !== C[ce] ? de(D, A, se, 2) : ce--);
      }
    }
  }, de = (g, y, A, I, L = null) => {
    const { el: R, type: z, transition: $, children: U, shapeFlag: F } = g;
    if (F & 6) {
      de(g.component.subTree, y, A, I);
      return;
    }
    if (F & 128) {
      g.suspense.move(y, A, I);
      return;
    }
    if (F & 64) {
      z.move(g, y, A, ct);
      return;
    }
    if (z === Be) {
      s(R, y, A);
      for (let H = 0; H < U.length; H++)
        de(U[H], y, A, I);
      s(g.anchor, y, A);
      return;
    }
    if (z === pi) {
      be(g, y, A);
      return;
    }
    if (I !== 2 && F & 1 && $)
      if (I === 0)
        $.beforeEnter(R), s(R, y, A), Dt(() => $.enter(R), L);
      else {
        const { leave: H, delayLeave: Y, afterLeave: Q } = $, ie = () => {
          g.ctx.isUnmounted ? i(R) : s(R, y, A);
        }, Pe = () => {
          H(R, () => {
            ie(), Q && Q();
          });
        };
        Y ? Y(R, ie, Pe) : Pe();
      }
    else
      s(R, y, A);
  }, Ye = (g, y, A, I = !1, L = !1) => {
    const {
      type: R,
      props: z,
      ref: $,
      children: U,
      dynamicChildren: F,
      shapeFlag: J,
      patchFlag: H,
      dirs: Y,
      cacheIndex: Q
    } = g;
    if (H === -2 && (L = !1), $ != null && (bn(), Ns($, null, A, g, !0), wn()), Q != null && (y.renderCache[Q] = void 0), J & 256) {
      y.ctx.deactivate(g);
      return;
    }
    const ie = J & 1 && Y, Pe = !Fs(g);
    let ce;
    if (Pe && (ce = z && z.onVnodeBeforeUnmount) && nn(ce, y, g), J & 6)
      me(g.component, A, I);
    else {
      if (J & 128) {
        g.suspense.unmount(A, I);
        return;
      }
      ie && Bn(g, null, y, "beforeUnmount"), J & 64 ? g.type.remove(
        g,
        y,
        A,
        ct,
        I
      ) : F && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !F.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (R !== Be || H > 0 && H & 64) ? ae(
        F,
        y,
        A,
        !1,
        !0
      ) : (R === Be && H & 384 || !L && J & 16) && ae(U, y, A), I && Oe(g);
    }
    (Pe && (ce = z && z.onVnodeUnmounted) || ie) && Dt(() => {
      ce && nn(ce, y, g), ie && Bn(g, null, y, "unmounted");
    }, A);
  }, Oe = (g) => {
    const { type: y, el: A, anchor: I, transition: L } = g;
    if (y === Be) {
      q(A, I);
      return;
    }
    if (y === pi) {
      k(g);
      return;
    }
    const R = () => {
      i(A), L && !L.persisted && L.afterLeave && L.afterLeave();
    };
    if (g.shapeFlag & 1 && L && !L.persisted) {
      const { leave: z, delayLeave: $ } = L, U = () => z(A, R);
      $ ? $(g.el, R, U) : U();
    } else
      R();
  }, q = (g, y) => {
    let A;
    for (; g !== y; )
      A = _(g), i(g), g = A;
    i(y);
  }, me = (g, y, A) => {
    const {
      bum: I,
      scope: L,
      job: R,
      subTree: z,
      um: $,
      m: U,
      a: F,
      parent: J,
      slots: { __: H }
    } = g;
    ua(U), ua(F), I && hi(I), J && pe(H) && H.forEach((Y) => {
      J.renderCache[Y] = void 0;
    }), L.stop(), R && (R.flags |= 8, Ye(z, g, y, A)), $ && Dt($, y), Dt(() => {
      g.isUnmounted = !0;
    }, y), y && y.pendingBranch && !y.isUnmounted && g.asyncDep && !g.asyncResolved && g.suspenseId === y.pendingId && (y.deps--, y.deps === 0 && y.resolve());
  }, ae = (g, y, A, I = !1, L = !1, R = 0) => {
    for (let z = R; z < g.length; z++)
      Ye(g[z], y, A, I, L);
  }, Fe = (g) => {
    if (g.shapeFlag & 6)
      return Fe(g.component.subTree);
    if (g.shapeFlag & 128)
      return g.suspense.next();
    const y = _(g.anchor || g.el), A = y && y[sf];
    return A ? _(A) : y;
  };
  let G = !1;
  const Xe = (g, y, A) => {
    g == null ? y._vnode && Ye(y._vnode, null, null, !0) : K(
      y._vnode || null,
      g,
      y,
      null,
      null,
      null,
      A
    ), y._vnode = g, G || (G = !0, ia(), Cl(), G = !1);
  }, ct = {
    p: K,
    um: Ye,
    m: de,
    r: Oe,
    mt: nt,
    mc: Ae,
    pc: ee,
    pbc: tt,
    n: Fe,
    o: e
  };
  return {
    render: Xe,
    hydrate: void 0,
    createApp: Af(Xe)
  };
}
function gr({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function $n({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Mf(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Kl(e, t, n = !1) {
  const s = e.children, i = t.children;
  if (pe(s) && pe(i))
    for (let r = 0; r < s.length; r++) {
      const o = s[r];
      let a = i[r];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[r] = Sn(i[r]), a.el = o.el), !n && a.patchFlag !== -2 && Kl(o, a)), a.type === Ki && (a.el = o.el), a.type === Ln && !a.el && (a.el = o.el);
    }
}
function Nf(e) {
  const t = e.slice(), n = [0];
  let s, i, r, o, a;
  const l = e.length;
  for (s = 0; s < l; s++) {
    const h = e[s];
    if (h !== 0) {
      if (i = n[n.length - 1], e[i] < h) {
        t[s] = i, n.push(s);
        continue;
      }
      for (r = 0, o = n.length - 1; r < o; )
        a = r + o >> 1, e[n[a]] < h ? r = a + 1 : o = a;
      h < e[n[r]] && (r > 0 && (t[s] = n[r - 1]), n[r] = s);
    }
  }
  for (r = n.length, o = n[r - 1]; r-- > 0; )
    n[r] = o, o = t[o];
  return n;
}
function Gl(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : Gl(t);
}
function ua(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
const Ff = Symbol.for("v-scx"), Df = () => di(Ff);
function jt(e, t, n) {
  return Yl(e, t, n);
}
function Yl(e, t, n = et) {
  const { immediate: s, deep: i, flush: r, once: o } = n, a = xt({}, n), l = t && s || !t && r !== "post";
  let h;
  if (Ws) {
    if (r === "sync") {
      const P = Df();
      h = P.__watcherHandles || (P.__watcherHandles = []);
    } else if (!l) {
      const P = () => {
      };
      return P.stop = an, P.resume = an, P.pause = an, P;
    }
  }
  const c = Ct;
  a.call = (P, M, K) => un(P, c, M, K);
  let w = !1;
  r === "post" ? a.scheduler = (P) => {
    Dt(P, c && c.suspense);
  } : r !== "sync" && (w = !0, a.scheduler = (P, M) => {
    M ? P() : co(P);
  }), a.augmentJob = (P) => {
    t && (P.flags |= 4), w && (P.flags |= 2, c && (P.id = c.uid, P.i = c));
  };
  const _ = Ju(e, t, a);
  return Ws && (h ? h.push(_) : l && _()), _;
}
function Bf(e, t, n) {
  const s = this.proxy, i = pt(e) ? e.includes(".") ? Xl(s, e) : () => s[e] : e.bind(s, s);
  let r;
  ye(t) ? r = t : (r = t.handler, n = t);
  const o = Gs(this), a = Yl(i, r.bind(s), n);
  return o(), a;
}
function Xl(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let i = 0; i < n.length && s; i++)
      s = s[n[i]];
    return s;
  };
}
const $f = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Rn(t)}Modifiers`] || e[`${Pn(t)}Modifiers`];
function Uf(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || et;
  let i = n;
  const r = t.startsWith("update:"), o = r && $f(s, t.slice(7));
  o && (o.trim && (i = n.map((c) => pt(c) ? c.trim() : c)), o.number && (i = n.map(Ir)));
  let a, l = s[a = cr(t)] || // also try camelCase event handler (#2249)
  s[a = cr(Rn(t))];
  !l && r && (l = s[a = cr(Pn(t))]), l && un(
    l,
    e,
    6,
    i
  );
  const h = s[a + "Once"];
  if (h) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[a])
      return;
    e.emitted[a] = !0, un(
      h,
      e,
      6,
      i
    );
  }
}
function Zl(e, t, n = !1) {
  const s = t.emitsCache, i = s.get(e);
  if (i !== void 0)
    return i;
  const r = e.emits;
  let o = {}, a = !1;
  if (!ye(e)) {
    const l = (h) => {
      const c = Zl(h, t, !0);
      c && (a = !0, xt(o, c));
    };
    !n && t.mixins.length && t.mixins.forEach(l), e.extends && l(e.extends), e.mixins && e.mixins.forEach(l);
  }
  return !r && !a ? (at(e) && s.set(e, null), null) : (pe(r) ? r.forEach((l) => o[l] = null) : xt(o, r), at(e) && s.set(e, o), o);
}
function Vi(e, t) {
  return !e || !Di(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), We(e, t[0].toLowerCase() + t.slice(1)) || We(e, Pn(t)) || We(e, t));
}
function fa(e) {
  const {
    type: t,
    vnode: n,
    proxy: s,
    withProxy: i,
    propsOptions: [r],
    slots: o,
    attrs: a,
    emit: l,
    render: h,
    renderCache: c,
    props: w,
    data: _,
    setupState: P,
    ctx: M,
    inheritAttrs: K
  } = e, Me = Ri(e);
  let fe, _e;
  try {
    if (n.shapeFlag & 4) {
      const k = i || s, N = k;
      fe = on(
        h.call(
          N,
          k,
          c,
          w,
          P,
          _,
          M
        )
      ), _e = a;
    } else {
      const k = t;
      fe = on(
        k.length > 1 ? k(
          w,
          { attrs: a, slots: o, emit: l }
        ) : k(
          w,
          null
        )
      ), _e = t.props ? a : zf(a);
    }
  } catch (k) {
    Bs.length = 0, qi(k, e, 1), fe = ln(Ln);
  }
  let be = fe;
  if (_e && K !== !1) {
    const k = Object.keys(_e), { shapeFlag: N } = be;
    k.length && N & 7 && (r && k.some(Qr) && (_e = Hf(
      _e,
      r
    )), be = cs(be, _e, !1, !0));
  }
  return n.dirs && (be = cs(be, null, !1, !0), be.dirs = be.dirs ? be.dirs.concat(n.dirs) : n.dirs), n.transition && uo(be, n.transition), fe = be, Ri(Me), fe;
}
const zf = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || Di(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, Hf = (e, t) => {
  const n = {};
  for (const s in e)
    (!Qr(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function qf(e, t, n) {
  const { props: s, children: i, component: r } = e, { props: o, children: a, patchFlag: l } = t, h = r.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && l >= 0) {
    if (l & 1024)
      return !0;
    if (l & 16)
      return s ? ha(s, o, h) : !!o;
    if (l & 8) {
      const c = t.dynamicProps;
      for (let w = 0; w < c.length; w++) {
        const _ = c[w];
        if (o[_] !== s[_] && !Vi(h, _))
          return !0;
      }
    }
  } else
    return (i || a) && (!a || !a.$stable) ? !0 : s === o ? !1 : s ? o ? ha(s, o, h) : !0 : !!o;
  return !1;
}
function ha(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let i = 0; i < s.length; i++) {
    const r = s[i];
    if (t[r] !== e[r] && !Vi(n, r))
      return !0;
  }
  return !1;
}
function Wf({ vnode: e, parent: t }, n) {
  for (; t; ) {
    const s = t.subTree;
    if (s.suspense && s.suspense.activeBranch === e && (s.el = e.el), s === e)
      (e = t.vnode).el = n, t = t.parent;
    else
      break;
  }
}
const Jl = (e) => e.__isSuspense;
function jf(e, t) {
  t && t.pendingBranch ? pe(e) ? t.effects.push(...e) : t.effects.push(e) : tf(e);
}
const Be = Symbol.for("v-fgt"), Ki = Symbol.for("v-txt"), Ln = Symbol.for("v-cmt"), pi = Symbol.for("v-stc"), Bs = [];
let Bt = null;
function x(e = !1) {
  Bs.push(Bt = e ? null : []);
}
function Vf() {
  Bs.pop(), Bt = Bs[Bs.length - 1] || null;
}
let qs = 1;
function da(e, t = !1) {
  qs += e, e < 0 && Bt && t && (Bt.hasOnce = !0);
}
function Ql(e) {
  return e.dynamicChildren = qs > 0 ? Bt || ns : null, Vf(), qs > 0 && Bt && Bt.push(e), e;
}
function T(e, t, n, s, i, r) {
  return Ql(
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
function ec(e, t, n, s, i) {
  return Ql(
    ln(
      e,
      t,
      n,
      s,
      i,
      !0
    )
  );
}
function tc(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function _s(e, t) {
  return e.type === t.type && e.key === t.key;
}
const nc = ({ key: e }) => e ?? null, gi = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? pt(e) || kt(e) || ye(e) ? { i: Vt, r: e, k: t, f: !!n } : e : null);
function b(e, t = null, n = null, s = 0, i = null, r = e === Be ? 0 : 1, o = !1, a = !1) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && nc(t),
    ref: t && gi(t),
    scopeId: Il,
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
    ctx: Vt
  };
  return a ? (po(l, n), r & 128 && e.normalize(l)) : n && (l.shapeFlag |= pt(n) ? 8 : 16), qs > 0 && // avoid a block node from tracking itself
  !o && // has current parent block
  Bt && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (l.patchFlag > 0 || r & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  l.patchFlag !== 32 && Bt.push(l), l;
}
const ln = Kf;
function Kf(e, t = null, n = null, s = 0, i = null, r = !1) {
  if ((!e || e === mf) && (e = Ln), tc(e)) {
    const a = cs(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && po(a, n), qs > 0 && !r && Bt && (a.shapeFlag & 6 ? Bt[Bt.indexOf(e)] = a : Bt.push(a)), a.patchFlag = -2, a;
  }
  if (ih(e) && (e = e.__vccOpts), t) {
    t = Gf(t);
    let { class: a, style: l } = t;
    a && !pt(a) && (t.class = Ke(a)), at(l) && (lo(l) && !pe(l) && (l = xt({}, l)), t.style = Te(l));
  }
  const o = pt(e) ? 1 : Jl(e) ? 128 : rf(e) ? 64 : at(e) ? 4 : ye(e) ? 2 : 0;
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
function Gf(e) {
  return e ? lo(e) || zl(e) ? xt({}, e) : e : null;
}
function cs(e, t, n = !1, s = !1) {
  const { props: i, ref: r, patchFlag: o, children: a, transition: l } = e, h = t ? Yf(i || {}, t) : i, c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: h,
    key: h && nc(h),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && r ? pe(r) ? r.concat(gi(t)) : [r, gi(t)] : gi(t)
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
    patchFlag: t && e.type !== Be ? o === -1 ? 16 : o | 16 : o,
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
  return l && s && uo(
    c,
    l.clone(c)
  ), c;
}
function dn(e = " ", t = 0) {
  return ln(Ki, null, e, t);
}
function Un(e, t) {
  const n = ln(pi, null, e);
  return n.staticCount = t, n;
}
function re(e = "", t = !1) {
  return t ? (x(), ec(Ln, null, e)) : ln(Ln, null, e);
}
function on(e) {
  return e == null || typeof e == "boolean" ? ln(Ln) : pe(e) ? ln(
    Be,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : tc(e) ? Sn(e) : ln(Ki, null, String(e));
}
function Sn(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : cs(e);
}
function po(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (pe(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const i = t.default;
      i && (i._c && (i._d = !1), po(e, i()), i._c && (i._d = !0));
      return;
    } else {
      n = 32;
      const i = t._;
      !i && !zl(t) ? t._ctx = Vt : i === 3 && Vt && (Vt.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else ye(t) ? (t = { default: t, _ctx: Vt }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [dn(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function Yf(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const i in s)
      if (i === "class")
        t.class !== s.class && (t.class = Ke([t.class, s.class]));
      else if (i === "style")
        t.style = Te([t.style, s.style]);
      else if (Di(i)) {
        const r = t[i], o = s[i];
        o && r !== o && !(pe(r) && r.includes(o)) && (t[i] = r ? [].concat(r, o) : o);
      } else i !== "" && (t[i] = s[i]);
  }
  return t;
}
function nn(e, t, n, s = null) {
  un(e, t, 7, [
    n,
    s
  ]);
}
const Xf = Bl();
let Zf = 0;
function Jf(e, t, n) {
  const s = e.type, i = (t ? t.appContext : e.appContext) || Xf, r = {
    uid: Zf++,
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
    scope: new Au(
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
    propsOptions: ql(s, i),
    emitsOptions: Zl(s, i),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: et,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: et,
    data: et,
    props: et,
    attrs: et,
    slots: et,
    refs: et,
    setupState: et,
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
  return r.ctx = { _: r }, r.root = t ? t.root : r, r.emit = Uf.bind(null, r), e.ce && e.ce(r), r;
}
let Ct = null;
const Qf = () => Ct || Vt;
let Li, $r;
{
  const e = Ui(), t = (n, s) => {
    let i;
    return (i = e[n]) || (i = e[n] = []), i.push(s), (r) => {
      i.length > 1 ? i.forEach((o) => o(r)) : i[0](r);
    };
  };
  Li = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => Ct = n
  ), $r = t(
    "__VUE_SSR_SETTERS__",
    (n) => Ws = n
  );
}
const Gs = (e) => {
  const t = Ct;
  return Li(e), e.scope.on(), () => {
    e.scope.off(), Li(t);
  };
}, pa = () => {
  Ct && Ct.scope.off(), Li(null);
};
function sc(e) {
  return e.vnode.shapeFlag & 4;
}
let Ws = !1;
function eh(e, t = !1, n = !1) {
  t && $r(t);
  const { props: s, children: i } = e.vnode, r = sc(e);
  Sf(e, s, r, t), If(e, i, n || t);
  const o = r ? th(e, t) : void 0;
  return t && $r(!1), o;
}
function th(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, _f);
  const { setup: s } = n;
  if (s) {
    bn();
    const i = e.setupContext = s.length > 1 ? sh(e) : null, r = Gs(e), o = Vs(
      s,
      e,
      0,
      [
        e.props,
        i
      ]
    ), a = sl(o);
    if (wn(), r(), (a || e.sp) && !Fs(e) && Ol(e), a) {
      if (o.then(pa, pa), t)
        return o.then((l) => {
          ga(e, l);
        }).catch((l) => {
          qi(l, e, 0);
        });
      e.asyncDep = o;
    } else
      ga(e, o);
  } else
    ic(e);
}
function ga(e, t, n) {
  ye(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : at(t) && (e.setupState = Tl(t)), ic(e);
}
function ic(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || an);
  {
    const i = Gs(e);
    bn();
    try {
      yf(e);
    } finally {
      wn(), i();
    }
  }
}
const nh = {
  get(e, t) {
    return wt(e, "get", ""), e[t];
  }
};
function sh(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, nh),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Gi(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Tl(ju(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in Ds)
        return Ds[n](e);
    },
    has(t, n) {
      return n in t || n in Ds;
    }
  })) : e.proxy;
}
function ih(e) {
  return ye(e) && "__vccOpts" in e;
}
const ue = (e, t) => Xu(e, t, Ws), rh = "3.5.18";
/**
* @vue/runtime-dom v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Ur;
const ma = typeof window < "u" && window.trustedTypes;
if (ma)
  try {
    Ur = /* @__PURE__ */ ma.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const rc = Ur ? (e) => Ur.createHTML(e) : (e) => e, oh = "http://www.w3.org/2000/svg", ah = "http://www.w3.org/1998/Math/MathML", gn = typeof document < "u" ? document : null, _a = gn && /* @__PURE__ */ gn.createElement("template"), lh = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const i = t === "svg" ? gn.createElementNS(oh, e) : t === "mathml" ? gn.createElementNS(ah, e) : n ? gn.createElement(e, { is: n }) : gn.createElement(e);
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
      _a.innerHTML = rc(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const a = _a.content;
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
}, ch = Symbol("_vtc");
function uh(e, t, n) {
  const s = e[ch];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const Oi = Symbol("_vod"), oc = Symbol("_vsh"), fh = {
  beforeMount(e, { value: t }, { transition: n }) {
    e[Oi] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : ys(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: s }) {
    !t != !n && (s ? t ? (s.beforeEnter(e), ys(e, !0), s.enter(e)) : s.leave(e, () => {
      ys(e, !1);
    }) : ys(e, t));
  },
  beforeUnmount(e, { value: t }) {
    ys(e, t);
  }
};
function ys(e, t) {
  e.style.display = t ? e[Oi] : "none", e[oc] = !t;
}
const hh = Symbol(""), dh = /(^|;)\s*display\s*:/;
function ph(e, t, n) {
  const s = e.style, i = pt(n);
  let r = !1;
  if (n && !i) {
    if (t)
      if (pt(t))
        for (const o of t.split(";")) {
          const a = o.slice(0, o.indexOf(":")).trim();
          n[a] == null && mi(s, a, "");
        }
      else
        for (const o in t)
          n[o] == null && mi(s, o, "");
    for (const o in n)
      o === "display" && (r = !0), mi(s, o, n[o]);
  } else if (i) {
    if (t !== n) {
      const o = s[hh];
      o && (n += ";" + o), s.cssText = n, r = dh.test(n);
    }
  } else t && e.removeAttribute("style");
  Oi in e && (e[Oi] = r ? s.display : "", e[oc] && (s.display = "none"));
}
const ya = /\s*!important$/;
function mi(e, t, n) {
  if (pe(n))
    n.forEach((s) => mi(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = gh(e, t);
    ya.test(n) ? e.setProperty(
      Pn(s),
      n.replace(ya, ""),
      "important"
    ) : e[s] = n;
  }
}
const va = ["Webkit", "Moz", "ms"], mr = {};
function gh(e, t) {
  const n = mr[t];
  if (n)
    return n;
  let s = Rn(t);
  if (s !== "filter" && s in e)
    return mr[t] = s;
  s = ol(s);
  for (let i = 0; i < va.length; i++) {
    const r = va[i] + s;
    if (r in e)
      return mr[t] = r;
  }
  return t;
}
const ba = "http://www.w3.org/1999/xlink";
function wa(e, t, n, s, i, r = xu(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(ba, t.slice(6, t.length)) : e.setAttributeNS(ba, t, n) : n == null || r && !al(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    r ? "" : On(n) ? String(n) : n
  );
}
function ka(e, t, n, s, i) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? rc(n) : n);
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
    a === "boolean" ? n = al(n) : n == null && a === "string" ? (n = "", o = !0) : a === "number" && (n = 0, o = !0);
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
function mh(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const xa = Symbol("_vei");
function _h(e, t, n, s, i = null) {
  const r = e[xa] || (e[xa] = {}), o = r[t];
  if (s && o)
    o.value = s;
  else {
    const [a, l] = yh(t);
    if (s) {
      const h = r[t] = wh(
        s,
        i
      );
      ts(e, a, h, l);
    } else o && (mh(e, a, o, l), r[t] = void 0);
  }
}
const Aa = /(?:Once|Passive|Capture)$/;
function yh(e) {
  let t;
  if (Aa.test(e)) {
    t = {};
    let s;
    for (; s = e.match(Aa); )
      e = e.slice(0, e.length - s[0].length), t[s[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : Pn(e.slice(2)), t];
}
let _r = 0;
const vh = /* @__PURE__ */ Promise.resolve(), bh = () => _r || (vh.then(() => _r = 0), _r = Date.now());
function wh(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    un(
      kh(s, n.value),
      t,
      5,
      [s]
    );
  };
  return n.value = e, n.attached = bh(), n;
}
function kh(e, t) {
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
const Ta = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, xh = (e, t, n, s, i, r) => {
  const o = i === "svg";
  t === "class" ? uh(e, s, o) : t === "style" ? ph(e, n, s) : Di(t) ? Qr(t) || _h(e, t, n, s, r) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Ah(e, t, s, o)) ? (ka(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && wa(e, t, s, o, r, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && (/[A-Z]/.test(t) || !pt(s)) ? ka(e, Rn(t), s, r, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), wa(e, t, s, o));
};
function Ah(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && Ta(t) && ye(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const i = e.tagName;
    if (i === "IMG" || i === "VIDEO" || i === "CANVAS" || i === "SOURCE")
      return !1;
  }
  return Ta(t) && pt(n) ? !1 : t in e;
}
const Sa = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return pe(t) ? (n) => hi(t, n) : t;
};
function Th(e) {
  e.target.composing = !0;
}
function Ea(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const yr = Symbol("_assign"), zn = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, i) {
    e[yr] = Sa(i);
    const r = s || i.props && i.props.type === "number";
    ts(e, t ? "change" : "input", (o) => {
      if (o.target.composing) return;
      let a = e.value;
      n && (a = a.trim()), r && (a = Ir(a)), e[yr](a);
    }), n && ts(e, "change", () => {
      e.value = e.value.trim();
    }), t || (ts(e, "compositionstart", Th), ts(e, "compositionend", Ea), ts(e, "change", Ea));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: i, number: r } }, o) {
    if (e[yr] = Sa(o), e.composing) return;
    const a = (r || e.type === "number") && !/^0\d/.test(e.value) ? Ir(e.value) : e.value, l = t ?? "";
    a !== l && (document.activeElement === e && e.type !== "range" && (s && t === n || i && e.value.trim() === l) || (e.value = l));
  }
}, Sh = ["ctrl", "shift", "alt", "meta"], Eh = {
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
  exact: (e, t) => Sh.some((n) => e[`${n}Key`] && !t.includes(n))
}, qn = (e, t) => {
  const n = e._withMods || (e._withMods = {}), s = t.join(".");
  return n[s] || (n[s] = (i, ...r) => {
    for (let o = 0; o < t.length; o++) {
      const a = Eh[t[o]];
      if (a && a(i, t)) return;
    }
    return e(i, ...r);
  });
}, Ch = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, _i = (e, t) => {
  const n = e._withKeys || (e._withKeys = {}), s = t.join(".");
  return n[s] || (n[s] = (i) => {
    if (!("key" in i))
      return;
    const r = Pn(i.key);
    if (t.some(
      (o) => o === r || Ch[o] === r
    ))
      return e(i);
  });
}, Rh = /* @__PURE__ */ xt({ patchProp: xh }, lh);
let Ca;
function Ih() {
  return Ca || (Ca = Of(Rh));
}
const Lh = (...e) => {
  const t = Ih().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const i = Ph(s);
    if (!i) return;
    const r = t._component;
    !ye(r) && !r.render && !r.template && (r.template = i.innerHTML), i.nodeType === 1 && (i.textContent = "");
    const o = n(i, !1, Oh(i));
    return i instanceof Element && (i.removeAttribute("v-cloak"), i.setAttribute("data-v-app", "")), o;
  }, t;
};
function Oh(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function Ph(e) {
  return pt(e) ? document.querySelector(e) : e;
}
const ls = (e) => {
  const t = e.replace("#", ""), n = parseInt(t.substr(0, 2), 16), s = parseInt(t.substr(2, 2), 16), i = parseInt(t.substr(4, 2), 16);
  return (n * 299 + s * 587 + i * 114) / 1e3 < 128;
}, Mh = (e, t) => {
  const n = e.replace("#", ""), s = parseInt(n.substr(0, 2), 16), i = parseInt(n.substr(2, 2), 16), r = parseInt(n.substr(4, 2), 16), o = ls(e), a = o ? Math.min(255, s + t) : Math.max(0, s - t), l = o ? Math.min(255, i + t) : Math.max(0, i - t), h = o ? Math.min(255, r + t) : Math.max(0, r - t);
  return `#${a.toString(16).padStart(2, "0")}${l.toString(16).padStart(2, "0")}${h.toString(16).padStart(2, "0")}`;
}, vs = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e), Nh = (e) => {
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
function go() {
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
var Vn = go();
function ac(e) {
  Vn = e;
}
var $s = { exec: () => null };
function je(e, t = "") {
  let n = typeof e == "string" ? e : e.source;
  const s = {
    replace: (i, r) => {
      let o = typeof r == "string" ? r : r.source;
      return o = o.replace(Rt.caret, "$1"), n = n.replace(i, o), s;
    },
    getRegex: () => new RegExp(n, t)
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
  listItemRegex: (e) => new RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),
  nextBulletRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
  hrRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
  fencesBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}(?:\`\`\`|~~~)`),
  headingBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}#`),
  htmlBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}<(?:[a-z].*>|!--)`, "i")
}, Fh = /^(?:[ \t]*(?:\n|$))+/, Dh = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Bh = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Ys = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, $h = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, mo = /(?:[*+-]|\d{1,9}[.)])/, lc = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, cc = je(lc).replace(/bull/g, mo).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Uh = je(lc).replace(/bull/g, mo).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), _o = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, zh = /^[^\n]+/, yo = /(?!\s*\])(?:\\.|[^\[\]\\])+/, Hh = je(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", yo).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), qh = je(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, mo).getRegex(), Yi = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", vo = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Wh = je(
  "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))",
  "i"
).replace("comment", vo).replace("tag", Yi).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), uc = je(_o).replace("hr", Ys).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Yi).getRegex(), jh = je(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", uc).getRegex(), bo = {
  blockquote: jh,
  code: Dh,
  def: Hh,
  fences: Bh,
  heading: $h,
  hr: Ys,
  html: Wh,
  lheading: cc,
  list: qh,
  newline: Fh,
  paragraph: uc,
  table: $s,
  text: zh
}, Ra = je(
  "^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
).replace("hr", Ys).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Yi).getRegex(), Vh = {
  ...bo,
  lheading: Uh,
  table: Ra,
  paragraph: je(_o).replace("hr", Ys).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Ra).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Yi).getRegex()
}, Kh = {
  ...bo,
  html: je(
    `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`
  ).replace("comment", vo).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: $s,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: je(_o).replace("hr", Ys).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", cc).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Gh = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Yh = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, fc = /^( {2,}|\\)\n(?!\s*$)/, Xh = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Xi = /[\p{P}\p{S}]/u, wo = /[\s\p{P}\p{S}]/u, hc = /[^\s\p{P}\p{S}]/u, Zh = je(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, wo).getRegex(), dc = /(?!~)[\p{P}\p{S}]/u, Jh = /(?!~)[\s\p{P}\p{S}]/u, Qh = /(?:[^\s\p{P}\p{S}]|~)/u, ed = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, pc = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, td = je(pc, "u").replace(/punct/g, Xi).getRegex(), nd = je(pc, "u").replace(/punct/g, dc).getRegex(), gc = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", sd = je(gc, "gu").replace(/notPunctSpace/g, hc).replace(/punctSpace/g, wo).replace(/punct/g, Xi).getRegex(), id = je(gc, "gu").replace(/notPunctSpace/g, Qh).replace(/punctSpace/g, Jh).replace(/punct/g, dc).getRegex(), rd = je(
  "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)",
  "gu"
).replace(/notPunctSpace/g, hc).replace(/punctSpace/g, wo).replace(/punct/g, Xi).getRegex(), od = je(/\\(punct)/, "gu").replace(/punct/g, Xi).getRegex(), ad = je(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), ld = je(vo).replace("(?:-->|$)", "-->").getRegex(), cd = je(
  "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>"
).replace("comment", ld).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Pi = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, ud = je(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", Pi).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), mc = je(/^!?\[(label)\]\[(ref)\]/).replace("label", Pi).replace("ref", yo).getRegex(), _c = je(/^!?\[(ref)\](?:\[\])?/).replace("ref", yo).getRegex(), fd = je("reflink|nolink(?!\\()", "g").replace("reflink", mc).replace("nolink", _c).getRegex(), ko = {
  _backpedal: $s,
  // only used for GFM url
  anyPunctuation: od,
  autolink: ad,
  blockSkip: ed,
  br: fc,
  code: Yh,
  del: $s,
  emStrongLDelim: td,
  emStrongRDelimAst: sd,
  emStrongRDelimUnd: rd,
  escape: Gh,
  link: ud,
  nolink: _c,
  punctuation: Zh,
  reflink: mc,
  reflinkSearch: fd,
  tag: cd,
  text: Xh,
  url: $s
}, hd = {
  ...ko,
  link: je(/^!?\[(label)\]\((.*?)\)/).replace("label", Pi).getRegex(),
  reflink: je(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Pi).getRegex()
}, zr = {
  ...ko,
  emStrongRDelimAst: id,
  emStrongLDelim: nd,
  url: je(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, dd = {
  ...zr,
  br: je(fc).replace("{2,}", "*").getRegex(),
  text: je(zr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, ai = {
  normal: bo,
  gfm: Vh,
  pedantic: Kh
}, bs = {
  normal: ko,
  gfm: zr,
  breaks: dd,
  pedantic: hd
}, pd = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Ia = (e) => pd[e];
function sn(e, t) {
  if (t) {
    if (Rt.escapeTest.test(e))
      return e.replace(Rt.escapeReplace, Ia);
  } else if (Rt.escapeTestNoEncode.test(e))
    return e.replace(Rt.escapeReplaceNoEncode, Ia);
  return e;
}
function La(e) {
  try {
    e = encodeURI(e).replace(Rt.percentDecode, "%");
  } catch {
    return null;
  }
  return e;
}
function Oa(e, t) {
  var r;
  const n = e.replace(Rt.findPipe, (o, a, l) => {
    let h = !1, c = a;
    for (; --c >= 0 && l[c] === "\\"; ) h = !h;
    return h ? "|" : " |";
  }), s = n.split(Rt.splitPipe);
  let i = 0;
  if (s[0].trim() || s.shift(), s.length > 0 && !((r = s.at(-1)) != null && r.trim()) && s.pop(), t)
    if (s.length > t)
      s.splice(t);
    else
      for (; s.length < t; ) s.push("");
  for (; i < s.length; i++)
    s[i] = s[i].trim().replace(Rt.slashPipe, "|");
  return s;
}
function ws(e, t, n) {
  const s = e.length;
  if (s === 0)
    return "";
  let i = 0;
  for (; i < s && e.charAt(s - i - 1) === t; )
    i++;
  return e.slice(0, s - i);
}
function gd(e, t) {
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
function Pa(e, t, n, s, i) {
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
function md(e, t, n) {
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
var Mi = class {
  // set by the lexer
  constructor(e) {
    Qe(this, "options");
    Qe(this, "rules");
    // set by the lexer
    Qe(this, "lexer");
    this.options = e || Vn;
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
        text: this.options.pedantic ? n : ws(n, `
`)
      };
    }
  }
  fences(e) {
    const t = this.rules.block.fences.exec(e);
    if (t) {
      const n = t[0], s = md(n, t[3] || "", this.rules);
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
        const s = ws(n, "#");
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
        raw: ws(t[0], `
`)
      };
  }
  blockquote(e) {
    const t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = ws(t[0], `
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
        const h = a.join(`
`), c = h.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        s = s ? `${s}
${h}` : h, i = i ? `${i}
${c}` : c;
        const w = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(c, r, !0), this.lexer.state.top = w, n.length === 0)
          break;
        const _ = r.at(-1);
        if ((_ == null ? void 0 : _.type) === "code")
          break;
        if ((_ == null ? void 0 : _.type) === "blockquote") {
          const P = _, M = P.raw + `
` + n.join(`
`), K = this.blockquote(M);
          r[r.length - 1] = K, s = s.substring(0, s.length - P.raw.length) + K.raw, i = i.substring(0, i.length - P.text.length) + K.text;
          break;
        } else if ((_ == null ? void 0 : _.type) === "list") {
          const P = _, M = P.raw + `
` + n.join(`
`), K = this.list(M);
          r[r.length - 1] = K, s = s.substring(0, s.length - _.raw.length) + K.raw, i = i.substring(0, i.length - P.raw.length) + K.raw, n = M.substring(r.at(-1).raw.length).split(`
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
        let l = !1, h = "", c = "";
        if (!(t = r.exec(e)) || this.rules.block.hr.test(e))
          break;
        h = t[0], e = e.substring(h.length);
        let w = t[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (fe) => " ".repeat(3 * fe.length)), _ = e.split(`
`, 1)[0], P = !w.trim(), M = 0;
        if (this.options.pedantic ? (M = 2, c = w.trimStart()) : P ? M = t[1].length + 1 : (M = t[2].search(this.rules.other.nonSpaceChar), M = M > 4 ? 1 : M, c = w.slice(M), M += t[1].length), P && this.rules.other.blankLine.test(_) && (h += _ + `
`, e = e.substring(_.length + 1), l = !0), !l) {
          const fe = this.rules.other.nextBulletRegex(M), _e = this.rules.other.hrRegex(M), be = this.rules.other.fencesBeginRegex(M), k = this.rules.other.headingBeginRegex(M), N = this.rules.other.htmlBeginRegex(M);
          for (; e; ) {
            const j = e.split(`
`, 1)[0];
            let V;
            if (_ = j, this.options.pedantic ? (_ = _.replace(this.rules.other.listReplaceNesting, "  "), V = _) : V = _.replace(this.rules.other.tabCharGlobal, "    "), be.test(_) || k.test(_) || N.test(_) || fe.test(_) || _e.test(_))
              break;
            if (V.search(this.rules.other.nonSpaceChar) >= M || !_.trim())
              c += `
` + V.slice(M);
            else {
              if (P || w.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || be.test(w) || k.test(w) || _e.test(w))
                break;
              c += `
` + _;
            }
            !P && !_.trim() && (P = !0), h += j + `
`, e = e.substring(j.length + 1), w = V.slice(M);
          }
        }
        i.loose || (o ? i.loose = !0 : this.rules.other.doubleBlankLine.test(h) && (o = !0));
        let K = null, Me;
        this.options.gfm && (K = this.rules.other.listIsTask.exec(c), K && (Me = K[0] !== "[ ] ", c = c.replace(this.rules.other.listReplaceTask, ""))), i.items.push({
          type: "list_item",
          raw: h,
          task: !!K,
          checked: Me,
          loose: !1,
          text: c,
          tokens: []
        }), i.raw += h;
      }
      const a = i.items.at(-1);
      if (a)
        a.raw = a.raw.trimEnd(), a.text = a.text.trimEnd();
      else
        return;
      i.raw = i.raw.trimEnd();
      for (let l = 0; l < i.items.length; l++)
        if (this.lexer.state.top = !1, i.items[l].tokens = this.lexer.blockTokens(i.items[l].text, []), !i.loose) {
          const h = i.items[l].tokens.filter((w) => w.type === "space"), c = h.length > 0 && h.some((w) => this.rules.other.anyLine.test(w.raw));
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
    const n = Oa(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = (o = t[3]) != null && o.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
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
        r.rows.push(Oa(a, r.header.length).map((l, h) => ({
          text: l,
          tokens: this.lexer.inline(l),
          header: !1,
          align: r.align[h]
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
        const r = ws(n.slice(0, -1), "\\");
        if ((n.length - r.length) % 2 === 0)
          return;
      } else {
        const r = gd(t[2], "()");
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
      return s = s.trim(), this.rules.other.startAngleBracket.test(s) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), Pa(t, {
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
      return Pa(n, i, n[0], this.lexer, this.rules);
    }
  }
  emStrong(e, t, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || s[3] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
    if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const r = [...s[0]].length - 1;
      let o, a, l = r, h = 0;
      const c = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c.lastIndex = 0, t = t.slice(-1 * e.length + r); (s = c.exec(t)) != null; ) {
        if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o) continue;
        if (a = [...o].length, s[3] || s[4]) {
          l += a;
          continue;
        } else if ((s[5] || s[6]) && r % 3 && !((r + a) % 3)) {
          h += a;
          continue;
        }
        if (l -= a, l > 0) continue;
        a = Math.min(a, a + l + h);
        const w = [...s[0]][0].length, _ = e.slice(0, r + s.index + w + a);
        if (Math.min(r, a) % 2) {
          const M = _.slice(1, -1);
          return {
            type: "em",
            raw: _,
            text: M,
            tokens: this.lexer.inlineTokens(M)
          };
        }
        const P = _.slice(2, -2);
        return {
          type: "strong",
          raw: _,
          text: P,
          tokens: this.lexer.inlineTokens(P)
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
}, yn = class Hr {
  constructor(t) {
    Qe(this, "tokens");
    Qe(this, "options");
    Qe(this, "state");
    Qe(this, "tokenizer");
    Qe(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = t || Vn, this.options.tokenizer = this.options.tokenizer || new Mi(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      other: Rt,
      block: ai.normal,
      inline: bs.normal
    };
    this.options.pedantic ? (n.block = ai.pedantic, n.inline = bs.pedantic) : this.options.gfm && (n.block = ai.gfm, this.options.breaks ? n.inline = bs.breaks : n.inline = bs.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: ai,
      inline: bs
    };
  }
  /**
   * Static Lex Method
   */
  static lex(t, n) {
    return new Hr(n).lex(t);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(t, n) {
    return new Hr(n).inlineTokens(t);
  }
  /**
   * Preprocessing
   */
  lex(t) {
    t = t.replace(Rt.carriageReturn, `
`), this.blockTokens(t, this.tokens);
    for (let n = 0; n < this.inlineQueue.length; n++) {
      const s = this.inlineQueue[n];
      this.inlineTokens(s.src, s.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(t, n = [], s = !1) {
    var i, r, o;
    for (this.options.pedantic && (t = t.replace(Rt.tabCharGlobal, "    ").replace(Rt.spaceLine, "")); t; ) {
      let a;
      if ((r = (i = this.options.extensions) == null ? void 0 : i.block) != null && r.some((h) => (a = h.call({ lexer: this }, t, n)) ? (t = t.substring(a.raw.length), n.push(a), !0) : !1))
        continue;
      if (a = this.tokenizer.space(t)) {
        t = t.substring(a.raw.length);
        const h = n.at(-1);
        a.raw.length === 1 && h !== void 0 ? h.raw += `
` : n.push(a);
        continue;
      }
      if (a = this.tokenizer.code(t)) {
        t = t.substring(a.raw.length);
        const h = n.at(-1);
        (h == null ? void 0 : h.type) === "paragraph" || (h == null ? void 0 : h.type) === "text" ? (h.raw += `
` + a.raw, h.text += `
` + a.text, this.inlineQueue.at(-1).src = h.text) : n.push(a);
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
        const h = n.at(-1);
        (h == null ? void 0 : h.type) === "paragraph" || (h == null ? void 0 : h.type) === "text" ? (h.raw += `
` + a.raw, h.text += `
` + a.raw, this.inlineQueue.at(-1).src = h.text) : this.tokens.links[a.tag] || (this.tokens.links[a.tag] = {
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
        let h = 1 / 0;
        const c = t.slice(1);
        let w;
        this.options.extensions.startBlock.forEach((_) => {
          w = _.call({ lexer: this }, c), typeof w == "number" && w >= 0 && (h = Math.min(h, w));
        }), h < 1 / 0 && h >= 0 && (l = t.substring(0, h + 1));
      }
      if (this.state.top && (a = this.tokenizer.paragraph(l))) {
        const h = n.at(-1);
        s && (h == null ? void 0 : h.type) === "paragraph" ? (h.raw += `
` + a.raw, h.text += `
` + a.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = h.text) : n.push(a), s = l.length !== t.length, t = t.substring(a.raw.length);
        continue;
      }
      if (a = this.tokenizer.text(t)) {
        t = t.substring(a.raw.length);
        const h = n.at(-1);
        (h == null ? void 0 : h.type) === "text" ? (h.raw += `
` + a.raw, h.text += `
` + a.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = h.text) : n.push(a);
        continue;
      }
      if (t) {
        const h = "Infinite loop on byte: " + t.charCodeAt(0);
        if (this.options.silent) {
          console.error(h);
          break;
        } else
          throw new Error(h);
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
    var a, l, h;
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
      if ((l = (a = this.options.extensions) == null ? void 0 : a.inline) != null && l.some((_) => (c = _.call({ lexer: this }, t, n)) ? (t = t.substring(c.raw.length), n.push(c), !0) : !1))
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
        const _ = n.at(-1);
        c.type === "text" && (_ == null ? void 0 : _.type) === "text" ? (_.raw += c.raw, _.text += c.text) : n.push(c);
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
      if ((h = this.options.extensions) != null && h.startInline) {
        let _ = 1 / 0;
        const P = t.slice(1);
        let M;
        this.options.extensions.startInline.forEach((K) => {
          M = K.call({ lexer: this }, P), typeof M == "number" && M >= 0 && (_ = Math.min(_, M));
        }), _ < 1 / 0 && _ >= 0 && (w = t.substring(0, _ + 1));
      }
      if (c = this.tokenizer.inlineText(w)) {
        t = t.substring(c.raw.length), c.raw.slice(-1) !== "_" && (o = c.raw.slice(-1)), r = !0;
        const _ = n.at(-1);
        (_ == null ? void 0 : _.type) === "text" ? (_.raw += c.raw, _.text += c.text) : n.push(c);
        continue;
      }
      if (t) {
        const _ = "Infinite loop on byte: " + t.charCodeAt(0);
        if (this.options.silent) {
          console.error(_);
          break;
        } else
          throw new Error(_);
      }
    }
    return n;
  }
}, Ni = class {
  // set by the parser
  constructor(e) {
    Qe(this, "options");
    Qe(this, "parser");
    this.options = e || Vn;
  }
  space(e) {
    return "";
  }
  code({ text: e, lang: t, escaped: n }) {
    var r;
    const s = (r = (t || "").match(Rt.notSpaceStart)) == null ? void 0 : r[0], i = e.replace(Rt.endingNewline, "") + `
`;
    return s ? '<pre><code class="language-' + sn(s) + '">' + (n ? i : sn(i, !0)) + `</code></pre>
` : "<pre><code>" + (n ? i : sn(i, !0)) + `</code></pre>
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
      e.loose ? ((n = e.tokens[0]) == null ? void 0 : n.type) === "paragraph" ? (e.tokens[0].text = s + " " + e.tokens[0].text, e.tokens[0].tokens && e.tokens[0].tokens.length > 0 && e.tokens[0].tokens[0].type === "text" && (e.tokens[0].tokens[0].text = s + " " + sn(e.tokens[0].tokens[0].text), e.tokens[0].tokens[0].escaped = !0)) : e.tokens.unshift({
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
    return `<code>${sn(e, !0)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({ tokens: e }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({ href: e, title: t, tokens: n }) {
    const s = this.parser.parseInline(n), i = La(e);
    if (i === null)
      return s;
    e = i;
    let r = '<a href="' + e + '"';
    return t && (r += ' title="' + sn(t) + '"'), r += ">" + s + "</a>", r;
  }
  image({ href: e, title: t, text: n, tokens: s }) {
    s && (n = this.parser.parseInline(s, this.parser.textRenderer));
    const i = La(e);
    if (i === null)
      return sn(n);
    e = i;
    let r = `<img src="${e}" alt="${n}"`;
    return t && (r += ` title="${sn(t)}"`), r += ">", r;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : sn(e.text);
  }
}, xo = class {
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
}, vn = class qr {
  constructor(t) {
    Qe(this, "options");
    Qe(this, "renderer");
    Qe(this, "textRenderer");
    this.options = t || Vn, this.options.renderer = this.options.renderer || new Ni(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new xo();
  }
  /**
   * Static Parse Method
   */
  static parse(t, n) {
    return new qr(n).parse(t);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(t, n) {
    return new qr(n).parseInline(t);
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
          for (; o + 1 < t.length && t[o + 1].type === "text"; )
            h = t[++o], c += `
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
  parseInline(t, n = this.renderer) {
    var i, r;
    let s = "";
    for (let o = 0; o < t.length; o++) {
      const a = t[o];
      if ((r = (i = this.options.extensions) == null ? void 0 : i.renderers) != null && r[a.type]) {
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
}, Cr, yi = (Cr = class {
  constructor(e) {
    Qe(this, "options");
    Qe(this, "block");
    this.options = e || Vn;
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
}, Qe(Cr, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
])), Cr), _d = class {
  constructor(...e) {
    Qe(this, "defaults", go());
    Qe(this, "options", this.setOptions);
    Qe(this, "parse", this.parseMarkdown(!0));
    Qe(this, "parseInline", this.parseMarkdown(!1));
    Qe(this, "Parser", vn);
    Qe(this, "Renderer", Ni);
    Qe(this, "TextRenderer", xo);
    Qe(this, "Lexer", yn);
    Qe(this, "Tokenizer", Mi);
    Qe(this, "Hooks", yi);
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
        const i = this.defaults.renderer || new Ni(this.defaults);
        for (const r in n.renderer) {
          if (!(r in i))
            throw new Error(`renderer '${r}' does not exist`);
          if (["options", "parser"].includes(r))
            continue;
          const o = r, a = n.renderer[o], l = i[o];
          i[o] = (...h) => {
            let c = a.apply(i, h);
            return c === !1 && (c = l.apply(i, h)), c || "";
          };
        }
        s.renderer = i;
      }
      if (n.tokenizer) {
        const i = this.defaults.tokenizer || new Mi(this.defaults);
        for (const r in n.tokenizer) {
          if (!(r in i))
            throw new Error(`tokenizer '${r}' does not exist`);
          if (["options", "rules", "lexer"].includes(r))
            continue;
          const o = r, a = n.tokenizer[o], l = i[o];
          i[o] = (...h) => {
            let c = a.apply(i, h);
            return c === !1 && (c = l.apply(i, h)), c;
          };
        }
        s.tokenizer = i;
      }
      if (n.hooks) {
        const i = this.defaults.hooks || new yi();
        for (const r in n.hooks) {
          if (!(r in i))
            throw new Error(`hook '${r}' does not exist`);
          if (["options", "block"].includes(r))
            continue;
          const o = r, a = n.hooks[o], l = i[o];
          yi.passThroughHooks.has(r) ? i[o] = (h) => {
            if (this.defaults.async)
              return Promise.resolve(a.call(i, h)).then((w) => l.call(i, w));
            const c = a.call(i, h);
            return l.call(i, c);
          } : i[o] = (...h) => {
            let c = a.apply(i, h);
            return c === !1 && (c = l.apply(i, h)), c;
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
        return Promise.resolve(r.hooks ? r.hooks.preprocess(n) : n).then((h) => a(h, r)).then((h) => r.hooks ? r.hooks.processAllTokens(h) : h).then((h) => r.walkTokens ? Promise.all(this.walkTokens(h, r.walkTokens)).then(() => h) : h).then((h) => l(h, r)).then((h) => r.hooks ? r.hooks.postprocess(h) : h).catch(o);
      try {
        r.hooks && (n = r.hooks.preprocess(n));
        let h = a(n, r);
        r.hooks && (h = r.hooks.processAllTokens(h)), r.walkTokens && this.walkTokens(h, r.walkTokens);
        let c = l(h, r);
        return r.hooks && (c = r.hooks.postprocess(c)), c;
      } catch (h) {
        return o(h);
      }
    };
  }
  onError(e, t) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        const s = "<p>An error occurred:</p><pre>" + sn(n.message + "", !0) + "</pre>";
        return t ? Promise.resolve(s) : s;
      }
      if (t)
        return Promise.reject(n);
      throw n;
    };
  }
}, jn = new _d();
function $e(e, t) {
  return jn.parse(e, t);
}
$e.options = $e.setOptions = function(e) {
  return jn.setOptions(e), $e.defaults = jn.defaults, ac($e.defaults), $e;
};
$e.getDefaults = go;
$e.defaults = Vn;
$e.use = function(...e) {
  return jn.use(...e), $e.defaults = jn.defaults, ac($e.defaults), $e;
};
$e.walkTokens = function(e, t) {
  return jn.walkTokens(e, t);
};
$e.parseInline = jn.parseInline;
$e.Parser = vn;
$e.parser = vn.parse;
$e.Renderer = Ni;
$e.TextRenderer = xo;
$e.Lexer = yn;
$e.lexer = yn.lex;
$e.Tokenizer = Mi;
$e.Hooks = yi;
$e.parse = $e;
$e.options;
$e.setOptions;
$e.use;
$e.walkTokens;
$e.parseInline;
vn.parse;
yn.lex;
/*! @license DOMPurify 3.2.6 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.2.6/LICENSE */
const {
  entries: yc,
  setPrototypeOf: Ma,
  isFrozen: yd,
  getPrototypeOf: vd,
  getOwnPropertyDescriptor: bd
} = Object;
let {
  freeze: It,
  seal: Gt,
  create: vc
} = Object, {
  apply: Wr,
  construct: jr
} = typeof Reflect < "u" && Reflect;
It || (It = function(t) {
  return t;
});
Gt || (Gt = function(t) {
  return t;
});
Wr || (Wr = function(t, n, s) {
  return t.apply(n, s);
});
jr || (jr = function(t, n) {
  return new t(...n);
});
const li = Lt(Array.prototype.forEach), wd = Lt(Array.prototype.lastIndexOf), Na = Lt(Array.prototype.pop), ks = Lt(Array.prototype.push), kd = Lt(Array.prototype.splice), vi = Lt(String.prototype.toLowerCase), vr = Lt(String.prototype.toString), Fa = Lt(String.prototype.match), xs = Lt(String.prototype.replace), xd = Lt(String.prototype.indexOf), Ad = Lt(String.prototype.trim), Jt = Lt(Object.prototype.hasOwnProperty), Tt = Lt(RegExp.prototype.test), As = Td(TypeError);
function Lt(e) {
  return function(t) {
    t instanceof RegExp && (t.lastIndex = 0);
    for (var n = arguments.length, s = new Array(n > 1 ? n - 1 : 0), i = 1; i < n; i++)
      s[i - 1] = arguments[i];
    return Wr(e, t, s);
  };
}
function Td(e) {
  return function() {
    for (var t = arguments.length, n = new Array(t), s = 0; s < t; s++)
      n[s] = arguments[s];
    return jr(e, n);
  };
}
function Ee(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : vi;
  Ma && Ma(e, null);
  let s = t.length;
  for (; s--; ) {
    let i = t[s];
    if (typeof i == "string") {
      const r = n(i);
      r !== i && (yd(t) || (t[s] = r), i = r);
    }
    e[i] = !0;
  }
  return e;
}
function Sd(e) {
  for (let t = 0; t < e.length; t++)
    Jt(e, t) || (e[t] = null);
  return e;
}
function pn(e) {
  const t = vc(null);
  for (const [n, s] of yc(e))
    Jt(e, n) && (Array.isArray(s) ? t[n] = Sd(s) : s && typeof s == "object" && s.constructor === Object ? t[n] = pn(s) : t[n] = s);
  return t;
}
function Ts(e, t) {
  for (; e !== null; ) {
    const s = bd(e, t);
    if (s) {
      if (s.get)
        return Lt(s.get);
      if (typeof s.value == "function")
        return Lt(s.value);
    }
    e = vd(e);
  }
  function n() {
    return null;
  }
  return n;
}
const Da = It(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "section", "select", "shadow", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]), br = It(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]), wr = It(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]), Ed = It(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]), kr = It(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]), Cd = It(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]), Ba = It(["#text"]), $a = It(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns", "slot"]), xr = It(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]), Ua = It(["accent", "accentunder", "align", "bevelled", "close", "columnsalign", "columnlines", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lspace", "lquote", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]), ci = It(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]), Rd = Gt(/\{\{[\w\W]*|[\w\W]*\}\}/gm), Id = Gt(/<%[\w\W]*|[\w\W]*%>/gm), Ld = Gt(/\$\{[\w\W]*/gm), Od = Gt(/^data-[\-\w.\u00B7-\uFFFF]+$/), Pd = Gt(/^aria-[\-\w]+$/), bc = Gt(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
), Md = Gt(/^(?:\w+script|data):/i), Nd = Gt(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
), wc = Gt(/^html$/i), Fd = Gt(/^[a-z][.\w]*(-[.\w]+)+$/i);
var za = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ARIA_ATTR: Pd,
  ATTR_WHITESPACE: Nd,
  CUSTOM_ELEMENT: Fd,
  DATA_ATTR: Od,
  DOCTYPE_NAME: wc,
  ERB_EXPR: Id,
  IS_ALLOWED_URI: bc,
  IS_SCRIPT_OR_DATA: Md,
  MUSTACHE_EXPR: Rd,
  TMPLIT_EXPR: Ld
});
const Ss = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9
}, Dd = function() {
  return typeof window > "u" ? null : window;
}, Bd = function(t, n) {
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
}, Ha = function() {
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
function kc() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : Dd();
  const t = (W) => kc(W);
  if (t.version = "3.2.6", t.removed = [], !e || !e.document || e.document.nodeType !== Ss.document || !e.Element)
    return t.isSupported = !1, t;
  let {
    document: n
  } = e;
  const s = n, i = s.currentScript, {
    DocumentFragment: r,
    HTMLTemplateElement: o,
    Node: a,
    Element: l,
    NodeFilter: h,
    NamedNodeMap: c = e.NamedNodeMap || e.MozNamedAttrMap,
    HTMLFormElement: w,
    DOMParser: _,
    trustedTypes: P
  } = e, M = l.prototype, K = Ts(M, "cloneNode"), Me = Ts(M, "remove"), fe = Ts(M, "nextSibling"), _e = Ts(M, "childNodes"), be = Ts(M, "parentNode");
  if (typeof o == "function") {
    const W = n.createElement("template");
    W.content && W.content.ownerDocument && (n = W.content.ownerDocument);
  }
  let k, N = "";
  const {
    implementation: j,
    createNodeIterator: V,
    createDocumentFragment: Ae,
    getElementsByTagName: Ne
  } = n, {
    importNode: tt
  } = s;
  let Ce = Ha();
  t.isSupported = typeof yc == "function" && typeof be == "function" && j && j.createHTMLDocument !== void 0;
  const {
    MUSTACHE_EXPR: ve,
    ERB_EXPR: Ge,
    TMPLIT_EXPR: nt,
    DATA_ATTR: lt,
    ARIA_ATTR: le,
    IS_SCRIPT_OR_DATA: ge,
    ATTR_WHITESPACE: ee,
    CUSTOM_ELEMENT: ot
  } = za;
  let {
    IS_ALLOWED_URI: Re
  } = za, de = null;
  const Ye = Ee({}, [...Da, ...br, ...wr, ...kr, ...Ba]);
  let Oe = null;
  const q = Ee({}, [...$a, ...xr, ...Ua, ...ci]);
  let me = Object.seal(vc(null, {
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
  })), ae = null, Fe = null, G = !0, Xe = !0, ct = !1, At = !0, g = !1, y = !0, A = !1, I = !1, L = !1, R = !1, z = !1, $ = !1, U = !0, F = !1;
  const J = "user-content-";
  let H = !0, Y = !1, Q = {}, ie = null;
  const Pe = Ee({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let ce = null;
  const ut = Ee({}, ["audio", "video", "img", "source", "image", "track"]);
  let Ue = null;
  const st = Ee({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]), f = "http://www.w3.org/1998/Math/MathML", v = "http://www.w3.org/2000/svg", C = "http://www.w3.org/1999/xhtml";
  let S = C, D = !1, X = null;
  const se = Ee({}, [f, v, C], vr);
  let ke = Ee({}, ["mi", "mo", "mn", "ms", "mtext"]), Se = Ee({}, ["annotation-xml"]);
  const Ze = Ee({}, ["title", "style", "font", "a", "script"]);
  let De = null;
  const gt = ["application/xhtml+xml", "text/html"], _t = "text/html";
  let ze = null, Yt = null;
  const Xs = n.createElement("form"), $t = function(m) {
    return m instanceof RegExp || m instanceof Function;
  }, Mn = function() {
    let m = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (!(Yt && Yt === m)) {
      if ((!m || typeof m != "object") && (m = {}), m = pn(m), De = // eslint-disable-next-line unicorn/prefer-includes
      gt.indexOf(m.PARSER_MEDIA_TYPE) === -1 ? _t : m.PARSER_MEDIA_TYPE, ze = De === "application/xhtml+xml" ? vr : vi, de = Jt(m, "ALLOWED_TAGS") ? Ee({}, m.ALLOWED_TAGS, ze) : Ye, Oe = Jt(m, "ALLOWED_ATTR") ? Ee({}, m.ALLOWED_ATTR, ze) : q, X = Jt(m, "ALLOWED_NAMESPACES") ? Ee({}, m.ALLOWED_NAMESPACES, vr) : se, Ue = Jt(m, "ADD_URI_SAFE_ATTR") ? Ee(pn(st), m.ADD_URI_SAFE_ATTR, ze) : st, ce = Jt(m, "ADD_DATA_URI_TAGS") ? Ee(pn(ut), m.ADD_DATA_URI_TAGS, ze) : ut, ie = Jt(m, "FORBID_CONTENTS") ? Ee({}, m.FORBID_CONTENTS, ze) : Pe, ae = Jt(m, "FORBID_TAGS") ? Ee({}, m.FORBID_TAGS, ze) : pn({}), Fe = Jt(m, "FORBID_ATTR") ? Ee({}, m.FORBID_ATTR, ze) : pn({}), Q = Jt(m, "USE_PROFILES") ? m.USE_PROFILES : !1, G = m.ALLOW_ARIA_ATTR !== !1, Xe = m.ALLOW_DATA_ATTR !== !1, ct = m.ALLOW_UNKNOWN_PROTOCOLS || !1, At = m.ALLOW_SELF_CLOSE_IN_ATTR !== !1, g = m.SAFE_FOR_TEMPLATES || !1, y = m.SAFE_FOR_XML !== !1, A = m.WHOLE_DOCUMENT || !1, R = m.RETURN_DOM || !1, z = m.RETURN_DOM_FRAGMENT || !1, $ = m.RETURN_TRUSTED_TYPE || !1, L = m.FORCE_BODY || !1, U = m.SANITIZE_DOM !== !1, F = m.SANITIZE_NAMED_PROPS || !1, H = m.KEEP_CONTENT !== !1, Y = m.IN_PLACE || !1, Re = m.ALLOWED_URI_REGEXP || bc, S = m.NAMESPACE || C, ke = m.MATHML_TEXT_INTEGRATION_POINTS || ke, Se = m.HTML_INTEGRATION_POINTS || Se, me = m.CUSTOM_ELEMENT_HANDLING || {}, m.CUSTOM_ELEMENT_HANDLING && $t(m.CUSTOM_ELEMENT_HANDLING.tagNameCheck) && (me.tagNameCheck = m.CUSTOM_ELEMENT_HANDLING.tagNameCheck), m.CUSTOM_ELEMENT_HANDLING && $t(m.CUSTOM_ELEMENT_HANDLING.attributeNameCheck) && (me.attributeNameCheck = m.CUSTOM_ELEMENT_HANDLING.attributeNameCheck), m.CUSTOM_ELEMENT_HANDLING && typeof m.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements == "boolean" && (me.allowCustomizedBuiltInElements = m.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements), g && (Xe = !1), z && (R = !0), Q && (de = Ee({}, Ba), Oe = [], Q.html === !0 && (Ee(de, Da), Ee(Oe, $a)), Q.svg === !0 && (Ee(de, br), Ee(Oe, xr), Ee(Oe, ci)), Q.svgFilters === !0 && (Ee(de, wr), Ee(Oe, xr), Ee(Oe, ci)), Q.mathMl === !0 && (Ee(de, kr), Ee(Oe, Ua), Ee(Oe, ci))), m.ADD_TAGS && (de === Ye && (de = pn(de)), Ee(de, m.ADD_TAGS, ze)), m.ADD_ATTR && (Oe === q && (Oe = pn(Oe)), Ee(Oe, m.ADD_ATTR, ze)), m.ADD_URI_SAFE_ATTR && Ee(Ue, m.ADD_URI_SAFE_ATTR, ze), m.FORBID_CONTENTS && (ie === Pe && (ie = pn(ie)), Ee(ie, m.FORBID_CONTENTS, ze)), H && (de["#text"] = !0), A && Ee(de, ["html", "head", "body"]), de.table && (Ee(de, ["tbody"]), delete ae.tbody), m.TRUSTED_TYPES_POLICY) {
        if (typeof m.TRUSTED_TYPES_POLICY.createHTML != "function")
          throw As('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
        if (typeof m.TRUSTED_TYPES_POLICY.createScriptURL != "function")
          throw As('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
        k = m.TRUSTED_TYPES_POLICY, N = k.createHTML("");
      } else
        k === void 0 && (k = Bd(P, i)), k !== null && typeof N == "string" && (N = k.createHTML(""));
      It && It(m), Yt = m;
    }
  }, tn = Ee({}, [...br, ...wr, ...Ed]), fs = Ee({}, [...kr, ...Cd]), Kn = function(m) {
    let B = be(m);
    (!B || !B.tagName) && (B = {
      namespaceURI: S,
      tagName: "template"
    });
    const Z = vi(m.tagName), Je = vi(B.tagName);
    return X[m.namespaceURI] ? m.namespaceURI === v ? B.namespaceURI === C ? Z === "svg" : B.namespaceURI === f ? Z === "svg" && (Je === "annotation-xml" || ke[Je]) : !!tn[Z] : m.namespaceURI === f ? B.namespaceURI === C ? Z === "math" : B.namespaceURI === v ? Z === "math" && Se[Je] : !!fs[Z] : m.namespaceURI === C ? B.namespaceURI === v && !Se[Je] || B.namespaceURI === f && !ke[Je] ? !1 : !fs[Z] && (Ze[Z] || !tn[Z]) : !!(De === "application/xhtml+xml" && X[m.namespaceURI]) : !1;
  }, Mt = function(m) {
    ks(t.removed, {
      element: m
    });
    try {
      be(m).removeChild(m);
    } catch {
      Me(m);
    }
  }, Ut = function(m, B) {
    try {
      ks(t.removed, {
        attribute: B.getAttributeNode(m),
        from: B
      });
    } catch {
      ks(t.removed, {
        attribute: null,
        from: B
      });
    }
    if (B.removeAttribute(m), m === "is")
      if (R || z)
        try {
          Mt(B);
        } catch {
        }
      else
        try {
          B.setAttribute(m, "");
        } catch {
        }
  }, Zs = function(m) {
    let B = null, Z = null;
    if (L)
      m = "<remove></remove>" + m;
    else {
      const Ie = Fa(m, /^[\r\n\t ]+/);
      Z = Ie && Ie[0];
    }
    De === "application/xhtml+xml" && S === C && (m = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + m + "</body></html>");
    const Je = k ? k.createHTML(m) : m;
    if (S === C)
      try {
        B = new _().parseFromString(Je, De);
      } catch {
      }
    if (!B || !B.documentElement) {
      B = j.createDocument(S, "template", null);
      try {
        B.documentElement.innerHTML = D ? N : Je;
      } catch {
      }
    }
    const rt = B.body || B.documentElement;
    return m && Z && rt.insertBefore(n.createTextNode(Z), rt.childNodes[0] || null), S === C ? Ne.call(B, A ? "html" : "body")[0] : A ? B.documentElement : rt;
  }, Nn = function(m) {
    return V.call(
      m.ownerDocument || m,
      m,
      // eslint-disable-next-line no-bitwise
      h.SHOW_ELEMENT | h.SHOW_COMMENT | h.SHOW_TEXT | h.SHOW_PROCESSING_INSTRUCTION | h.SHOW_CDATA_SECTION,
      null
    );
  }, Gn = function(m) {
    return m instanceof w && (typeof m.nodeName != "string" || typeof m.textContent != "string" || typeof m.removeChild != "function" || !(m.attributes instanceof c) || typeof m.removeAttribute != "function" || typeof m.setAttribute != "function" || typeof m.namespaceURI != "string" || typeof m.insertBefore != "function" || typeof m.hasChildNodes != "function");
  }, Js = function(m) {
    return typeof a == "function" && m instanceof a;
  };
  function zt(W, m, B) {
    li(W, (Z) => {
      Z.call(t, m, B, Yt);
    });
  }
  const Fn = function(m) {
    let B = null;
    if (zt(Ce.beforeSanitizeElements, m, null), Gn(m))
      return Mt(m), !0;
    const Z = ze(m.nodeName);
    if (zt(Ce.uponSanitizeElement, m, {
      tagName: Z,
      allowedTags: de
    }), y && m.hasChildNodes() && !Js(m.firstElementChild) && Tt(/<[/\w!]/g, m.innerHTML) && Tt(/<[/\w!]/g, m.textContent) || m.nodeType === Ss.progressingInstruction || y && m.nodeType === Ss.comment && Tt(/<[/\w]/g, m.data))
      return Mt(m), !0;
    if (!de[Z] || ae[Z]) {
      if (!ae[Z] && Nt(Z) && (me.tagNameCheck instanceof RegExp && Tt(me.tagNameCheck, Z) || me.tagNameCheck instanceof Function && me.tagNameCheck(Z)))
        return !1;
      if (H && !ie[Z]) {
        const Je = be(m) || m.parentNode, rt = _e(m) || m.childNodes;
        if (rt && Je) {
          const Ie = rt.length;
          for (let ht = Ie - 1; ht >= 0; --ht) {
            const yt = K(rt[ht], !0);
            yt.__removalCount = (m.__removalCount || 0) + 1, Je.insertBefore(yt, fe(m));
          }
        }
      }
      return Mt(m), !0;
    }
    return m instanceof l && !Kn(m) || (Z === "noscript" || Z === "noembed" || Z === "noframes") && Tt(/<\/no(script|embed|frames)/i, m.innerHTML) ? (Mt(m), !0) : (g && m.nodeType === Ss.text && (B = m.textContent, li([ve, Ge, nt], (Je) => {
      B = xs(B, Je, " ");
    }), m.textContent !== B && (ks(t.removed, {
      element: m.cloneNode()
    }), m.textContent = B)), zt(Ce.afterSanitizeElements, m, null), !1);
  }, Yn = function(m, B, Z) {
    if (U && (B === "id" || B === "name") && (Z in n || Z in Xs))
      return !1;
    if (!(Xe && !Fe[B] && Tt(lt, B))) {
      if (!(G && Tt(le, B))) {
        if (!Oe[B] || Fe[B]) {
          if (
            // First condition does a very basic check if a) it's basically a valid custom element tagname AND
            // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
            !(Nt(m) && (me.tagNameCheck instanceof RegExp && Tt(me.tagNameCheck, m) || me.tagNameCheck instanceof Function && me.tagNameCheck(m)) && (me.attributeNameCheck instanceof RegExp && Tt(me.attributeNameCheck, B) || me.attributeNameCheck instanceof Function && me.attributeNameCheck(B)) || // Alternative, second condition checks if it's an `is`-attribute, AND
            // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            B === "is" && me.allowCustomizedBuiltInElements && (me.tagNameCheck instanceof RegExp && Tt(me.tagNameCheck, Z) || me.tagNameCheck instanceof Function && me.tagNameCheck(Z)))
          ) return !1;
        } else if (!Ue[B]) {
          if (!Tt(Re, xs(Z, ee, ""))) {
            if (!((B === "src" || B === "xlink:href" || B === "href") && m !== "script" && xd(Z, "data:") === 0 && ce[m])) {
              if (!(ct && !Tt(ge, xs(Z, ee, "")))) {
                if (Z)
                  return !1;
              }
            }
          }
        }
      }
    }
    return !0;
  }, Nt = function(m) {
    return m !== "annotation-xml" && Fa(m, ot);
  }, Ft = function(m) {
    zt(Ce.beforeSanitizeAttributes, m, null);
    const {
      attributes: B
    } = m;
    if (!B || Gn(m))
      return;
    const Z = {
      attrName: "",
      attrValue: "",
      keepAttr: !0,
      allowedAttributes: Oe,
      forceKeepAttr: void 0
    };
    let Je = B.length;
    for (; Je--; ) {
      const rt = B[Je], {
        name: Ie,
        namespaceURI: ht,
        value: yt
      } = rt, Dn = ze(Ie), hs = yt;
      let mt = Ie === "value" ? hs : Ad(hs);
      if (Z.attrName = Dn, Z.attrValue = mt, Z.keepAttr = !0, Z.forceKeepAttr = void 0, zt(Ce.uponSanitizeAttribute, m, Z), mt = Z.attrValue, F && (Dn === "id" || Dn === "name") && (Ut(Ie, m), mt = J + mt), y && Tt(/((--!?|])>)|<\/(style|title)/i, mt)) {
        Ut(Ie, m);
        continue;
      }
      if (Z.forceKeepAttr)
        continue;
      if (!Z.keepAttr) {
        Ut(Ie, m);
        continue;
      }
      if (!At && Tt(/\/>/i, mt)) {
        Ut(Ie, m);
        continue;
      }
      g && li([ve, Ge, nt], (ei) => {
        mt = xs(mt, ei, " ");
      });
      const Qs = ze(m.nodeName);
      if (!Yn(Qs, Dn, mt)) {
        Ut(Ie, m);
        continue;
      }
      if (k && typeof P == "object" && typeof P.getAttributeType == "function" && !ht)
        switch (P.getAttributeType(Qs, Dn)) {
          case "TrustedHTML": {
            mt = k.createHTML(mt);
            break;
          }
          case "TrustedScriptURL": {
            mt = k.createScriptURL(mt);
            break;
          }
        }
      if (mt !== hs)
        try {
          ht ? m.setAttributeNS(ht, Ie, mt) : m.setAttribute(Ie, mt), Gn(m) ? Mt(m) : Na(t.removed);
        } catch {
          Ut(Ie, m);
        }
    }
    zt(Ce.afterSanitizeAttributes, m, null);
  }, ft = function W(m) {
    let B = null;
    const Z = Nn(m);
    for (zt(Ce.beforeSanitizeShadowDOM, m, null); B = Z.nextNode(); )
      zt(Ce.uponSanitizeShadowNode, B, null), Fn(B), Ft(B), B.content instanceof r && W(B.content);
    zt(Ce.afterSanitizeShadowDOM, m, null);
  };
  return t.sanitize = function(W) {
    let m = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, B = null, Z = null, Je = null, rt = null;
    if (D = !W, D && (W = "<!-->"), typeof W != "string" && !Js(W))
      if (typeof W.toString == "function") {
        if (W = W.toString(), typeof W != "string")
          throw As("dirty is not a string, aborting");
      } else
        throw As("toString is not a function");
    if (!t.isSupported)
      return W;
    if (I || Mn(m), t.removed = [], typeof W == "string" && (Y = !1), Y) {
      if (W.nodeName) {
        const yt = ze(W.nodeName);
        if (!de[yt] || ae[yt])
          throw As("root node is forbidden and cannot be sanitized in-place");
      }
    } else if (W instanceof a)
      B = Zs("<!---->"), Z = B.ownerDocument.importNode(W, !0), Z.nodeType === Ss.element && Z.nodeName === "BODY" || Z.nodeName === "HTML" ? B = Z : B.appendChild(Z);
    else {
      if (!R && !g && !A && // eslint-disable-next-line unicorn/prefer-includes
      W.indexOf("<") === -1)
        return k && $ ? k.createHTML(W) : W;
      if (B = Zs(W), !B)
        return R ? null : $ ? N : "";
    }
    B && L && Mt(B.firstChild);
    const Ie = Nn(Y ? W : B);
    for (; Je = Ie.nextNode(); )
      Fn(Je), Ft(Je), Je.content instanceof r && ft(Je.content);
    if (Y)
      return W;
    if (R) {
      if (z)
        for (rt = Ae.call(B.ownerDocument); B.firstChild; )
          rt.appendChild(B.firstChild);
      else
        rt = B;
      return (Oe.shadowroot || Oe.shadowrootmode) && (rt = tt.call(s, rt, !0)), rt;
    }
    let ht = A ? B.outerHTML : B.innerHTML;
    return A && de["!doctype"] && B.ownerDocument && B.ownerDocument.doctype && B.ownerDocument.doctype.name && Tt(wc, B.ownerDocument.doctype.name) && (ht = "<!DOCTYPE " + B.ownerDocument.doctype.name + `>
` + ht), g && li([ve, Ge, nt], (yt) => {
      ht = xs(ht, yt, " ");
    }), k && $ ? k.createHTML(ht) : ht;
  }, t.setConfig = function() {
    let W = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    Mn(W), I = !0;
  }, t.clearConfig = function() {
    Yt = null, I = !1;
  }, t.isValidAttribute = function(W, m, B) {
    Yt || Mn({});
    const Z = ze(W), Je = ze(m);
    return Yn(Z, Je, B);
  }, t.addHook = function(W, m) {
    typeof m == "function" && ks(Ce[W], m);
  }, t.removeHook = function(W, m) {
    if (m !== void 0) {
      const B = wd(Ce[W], m);
      return B === -1 ? void 0 : kd(Ce[W], B, 1)[0];
    }
    return Na(Ce[W]);
  }, t.removeHooks = function(W) {
    Ce[W] = [];
  }, t.removeAllHooks = function() {
    Ce = Ha();
  }, t;
}
var Ao = kc();
Ao.addHook("uponSanitizeElement", (e, t) => {
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
Ao.addHook("afterSanitizeAttributes", (e) => {
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
function $d(e) {
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
  return Ao.sanitize(e, t);
}
$e.setOptions({
  renderer: new $e.Renderer(),
  gfm: !0,
  breaks: !0
});
const bi = (e) => $d($e(e || "")), Ud = { class: "askai" }, zd = { class: "askai__bar" }, Hd = ["value", "placeholder", "disabled", "aria-label", "onKeydown"], qd = { class: "askai__intro" }, Wd = { class: "askai__title" }, jd = {
  key: 0,
  class: "askai__subtitle"
}, Vd = {
  key: 0,
  class: "askai__suggestions"
}, Kd = ["disabled", "onClick"], Gd = ["aria-live"], Yd = {
  key: 0,
  class: "askai__question"
}, Xd = {
  key: 1,
  class: "askai__system"
}, Zd = ["innerHTML"], Jd = {
  key: 0,
  class: "askai__sources"
}, Qd = ["title"], ep = {
  key: 0,
  class: "askai__thinking",
  role: "status",
  "aria-live": "polite"
}, tp = { class: "askai__thinking-text" }, np = { class: "askai__foot" }, sp = { key: 0 }, ip = /* @__PURE__ */ Ll({
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
    isStreaming: { type: Function }
  },
  emits: ["update:draft", "send", "ask", "close"],
  setup(e, { emit: t }) {
    const n = e, s = t, i = oe(null), r = oe(null), o = oe(null), a = ["user", "bot", "agent", "system"], l = ue(
      () => n.messages.map((k, N) => ({ message: k, index: N })).filter(({ message: k }) => a.includes(k.message_type))
    ), h = ue(() => l.value.length > 0), c = (k) => {
      s("update:draft", k.target.value);
    }, w = () => {
      !n.inputEnabled || !n.draft.trim() || s("send");
    }, _ = (k) => {
      n.inputEnabled && s("ask", k);
    }, P = typeof navigator < "u" && /Mac|iPod|iPhone|iPad/.test(navigator.platform || ""), M = (k) => {
      if (k.key === "Escape") {
        k.preventDefault(), s("close");
        return;
      }
      const N = P ? k.metaKey && !k.ctrlKey : k.ctrlKey && !k.metaKey;
      n.hotkey && N && !k.altKey && (k.key === "k" || k.key === "K") && (k.preventDefault(), s("close"));
    }, K = () => {
      os(() => {
        var k;
        return (k = i.value) == null ? void 0 : k.focus();
      });
    };
    let Me = 0;
    const fe = () => {
      if (!o.value) return;
      const k = o.value.closest(".askai"), N = r.value;
      if (!k || !N) return;
      const j = k.offsetHeight - N.offsetHeight, V = getComputedStyle(N), Ae = parseFloat(V.paddingTop) + parseFloat(V.paddingBottom), Ne = Math.ceil(j + Ae + o.value.getBoundingClientRect().height);
      Math.abs(Ne - Me) < 3 || (Me = Ne, window.parent.postMessage({ type: "WIDGET_RESIZE", height: Ne }, "*"));
    };
    let _e = null;
    const be = ue(
      () => l.value.reduce((k, { message: N, index: j }) => k + n.displayText(j, N.message || "").length, 0)
    );
    return jt(
      () => [l.value.length, be.value, n.loading],
      () => os(() => {
        r.value && (r.value.scrollTop = r.value.scrollHeight);
      })
    ), jt(() => n.active, (k) => {
      k && K();
    }), ji(() => {
      n.active && K(), window.addEventListener("keydown", M), o.value && typeof ResizeObserver < "u" && (_e = new ResizeObserver(() => fe()), _e.observe(o.value)), fe();
    }), Nl(() => {
      window.removeEventListener("keydown", M), _e == null || _e.disconnect(), _e = null;
    }), (k, N) => (x(), T("div", Ud, [
      b("div", zd, [
        N[2] || (N[2] = b("svg", {
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
          value: k.draft,
          placeholder: k.placeholder,
          disabled: !k.inputEnabled,
          "aria-label": k.placeholder,
          autocomplete: "off",
          spellcheck: "false",
          onInput: c,
          onKeydown: _i(qn(w, ["prevent"]), ["enter"])
        }, null, 40, Hd),
        b("button", {
          type: "button",
          class: "askai__close",
          "aria-label": "Close",
          title: "Close (Esc)",
          onClick: N[0] || (N[0] = (j) => s("close"))
        }, N[1] || (N[1] = [
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
          h.value ? (x(), T(Be, { key: 1 }, [
            (x(!0), T(Be, null, vt(l.value, ({ message: j, index: V }) => (x(), T("div", {
              key: V,
              class: "askai__turn",
              "aria-live": k.isStreaming(V) ? "off" : "polite"
            }, [
              j.message_type === "user" ? (x(), T("p", Yd, ne(j.message), 1)) : j.message_type === "system" ? (x(), T("p", Xd, ne(j.message), 1)) : (x(), T(Be, { key: 2 }, [
                b("div", {
                  class: Ke(["askai__answer", { "askai__answer--streaming": k.isStreaming(V) }]),
                  innerHTML: E(bi)(k.isStreaming(V) ? k.displayText(V, j.message || "") : j.message || "")
                }, null, 10, Zd),
                k.showCitations && !k.isStreaming(V) && j.sources && j.sources.length ? (x(), T("div", Jd, [
                  N[5] || (N[5] = b("span", { class: "askai__label" }, "Sources", -1)),
                  (x(!0), T(Be, null, vt(j.sources, (Ae, Ne) => (x(), T("span", {
                    key: Ne,
                    class: "askai__source",
                    title: k.citationTooltip(Ae)
                  }, ne(k.citationLabel(Ae)), 9, Qd))), 128))
                ])) : re("", !0)
              ], 64))
            ], 8, Gd))), 128)),
            k.loading ? (x(), T("div", ep, [
              N[6] || (N[6] = b("span", { class: "askai__dot" }, null, -1)),
              N[7] || (N[7] = b("span", { class: "askai__dot" }, null, -1)),
              N[8] || (N[8] = b("span", { class: "askai__dot" }, null, -1)),
              b("span", tp, ne(k.showCitations ? "Searching the knowledge base" : "Thinking"), 1)
            ])) : re("", !0)
          ], 64)) : (x(), T(Be, { key: 0 }, [
            b("div", qd, [
              b("h2", Wd, ne(k.welcomeTitle || `Ask ${k.agentName}`), 1),
              k.welcomeSubtitle ? (x(), T("p", jd, ne(k.welcomeSubtitle), 1)) : re("", !0)
            ]),
            k.suggestions.length && !k.draft.trim() ? (x(), T("div", Vd, [
              N[4] || (N[4] = b("p", { class: "askai__label" }, "Suggested", -1)),
              (x(!0), T(Be, null, vt(k.suggestions, (j) => (x(), T("button", {
                key: j,
                type: "button",
                class: "askai__suggestion",
                disabled: !k.inputEnabled,
                onClick: (V) => _(j)
              }, [
                b("span", null, ne(j), 1),
                N[3] || (N[3] = b("svg", {
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
              ], 8, Kd))), 128))
            ])) : re("", !0)
          ], 64))
        ], 512)
      ], 512),
      b("div", np, [
        k.disclaimer ? (x(), T("span", sp, ne(k.disclaimer), 1)) : re("", !0),
        N[9] || (N[9] = b("a", {
          class: "askai__brand",
          href: "https://chattermate.chat",
          target: "_blank",
          rel: "noopener noreferrer"
        }, "Powered by ChatterMate", -1))
      ])
    ]));
  }
}), xc = (e, t) => {
  const n = e.__vccOpts || e;
  for (const [s, i] of t)
    n[s] = i;
  return n;
}, rp = /* @__PURE__ */ xc(ip, [["__scopeId", "data-v-a4ce6416"]]), Is = [
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
], op = (e) => (e || "").split("").reduce((t, n) => t + n.charCodeAt(0), 0) % Is.length, ap = (e) => {
  const t = Is[(e % Is.length + Is.length) % Is.length];
  return {
    background: `
            radial-gradient(circle at 32% 28%, rgba(255,255,255,0.22) 0%, transparent 42%),
            radial-gradient(circle at 68% 72%, rgba(0,0,0,0.25) 0%, transparent 38%),
            radial-gradient(ellipse at 50% 50%, ${t.stops})
        `.trim(),
    boxShadow: `0 4px 28px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
    borderRadius: "50%"
  };
}, lp = (e, t) => {
  const n = typeof t == "number" && Number.isFinite(t) ? t : op(e);
  return ap(n);
}, qa = (e) => {
  var t;
  return !!((t = e == null ? void 0 : e.attributes) != null && t.end_chat);
}, Wa = "AI can make mistakes. Check important info.";
function cp(e, t = !1) {
  return e !== !1 && !t;
}
const Ac = (e) => !!e && (/^https?:\/\//i.test(e) || e.startsWith("data:")), up = (e, t) => e ? Ac(e) || e.startsWith("blob:") ? e : `${t.replace(/\/api\/v1\/?$/, "")}${e.startsWith("/") ? "" : "/"}${e}` : "";
function ja() {
  return typeof window < "u" && window.APP_CONFIG ? window.APP_CONFIG : {};
}
const js = {
  get API_URL() {
    return ja().API_URL || "https://api.chattermate.chat/api/v1";
  },
  get WS_URL() {
    return ja().WS_URL || "wss://api.chattermate.chat";
  }
};
function Fi(e) {
  return up(e, js.API_URL);
}
function fp(e) {
  const t = ue(() => ({
    backgroundColor: "var(--cm-card)",
    color: "var(--cm-text)"
  })), n = ue(() => ({
    backgroundColor: e.value.chat_bubble_color || "#C9F24E",
    color: ls(e.value.chat_bubble_color || "#C9F24E") ? "#FFFFFF" : "#000000"
  })), s = ue(() => ({
    backgroundColor: "var(--cm-agent-bg)",
    color: "var(--cm-text)"
  })), i = ue(() => ({
    backgroundColor: "var(--cm-accent)",
    color: "var(--cm-on-accent)"
  })), r = ue(() => ({
    color: "var(--cm-text)"
  })), o = ue(() => ({
    borderBottom: "1px solid var(--cm-hairline)"
  })), a = ue(() => Fi(e.value.photo_url)), l = ue(() => {
    const h = e.value.chat_background_color || "#ffffff";
    return {
      boxShadow: `0 8px 5px ${ls(h) ? "rgba(0, 0, 0, 0.24)" : "rgba(0, 0, 0, 0.12)"}`
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
const hp = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]), dp = /* @__PURE__ */ new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);
[...hp, ...dp];
function pp(e, t) {
  const n = oe([]), s = oe(!1), i = oe(null), r = (N) => {
    if (N === 0) return "0 Bytes";
    const j = 1024, V = ["Bytes", "KB", "MB", "GB"], Ae = Math.floor(Math.log(N) / Math.log(j));
    return parseFloat((N / Math.pow(j, Ae)).toFixed(2)) + " " + V[Ae];
  }, o = (N) => N.startsWith("image/"), a = (N) => N ? Fi(N) : "", l = (N) => {
    const j = N.file_url || N.url;
    return j ? Fi(j) : "";
  }, h = async (N) => {
    const j = N.target;
    j.files && j.files.length > 0 && (await K(Array.from(j.files)), j.value = "");
  }, c = async (N) => {
    var V;
    N.preventDefault();
    const j = (V = N.dataTransfer) == null ? void 0 : V.files;
    j && j.length > 0 && await K(Array.from(j));
  }, w = (N) => {
    N.preventDefault();
  }, _ = (N) => {
    N.preventDefault();
  }, P = async (N) => {
    var Ae;
    const j = (Ae = N.clipboardData) == null ? void 0 : Ae.items;
    if (!j) return;
    const V = [];
    for (const Ne of Array.from(j))
      if (Ne.kind === "file") {
        const tt = Ne.getAsFile();
        tt && V.push(tt);
      }
    V.length > 0 && await K(V);
  }, M = async (N, j = 500) => new Promise((V, Ae) => {
    const Ne = new FileReader();
    Ne.onload = (tt) => {
      var ve;
      const Ce = new Image();
      Ce.onload = () => {
        const Ge = document.createElement("canvas");
        let nt = Ce.width, lt = Ce.height;
        const le = 1920;
        (nt > le || lt > le) && (nt > lt ? (lt = lt / nt * le, nt = le) : (nt = nt / lt * le, lt = le)), Ge.width = nt, Ge.height = lt;
        const ge = Ge.getContext("2d");
        if (!ge) {
          Ae(new Error("Failed to get canvas context"));
          return;
        }
        ge.drawImage(Ce, 0, 0, nt, lt);
        let ee = 0.9;
        const ot = () => {
          Ge.toBlob((Re) => {
            if (!Re) {
              Ae(new Error("Failed to compress image"));
              return;
            }
            if (Re.size / 1024 > j && ee > 0.3)
              ee -= 0.1, ot();
            else {
              const Ye = new FileReader();
              Ye.onload = () => {
                const Oe = Ye.result.split(",")[1];
                V({ blob: Re, base64: Oe });
              }, Ye.readAsDataURL(Re);
            }
          }, N.type === "image/png" ? "image/png" : "image/jpeg", ee);
        };
        ot();
      }, Ce.onerror = () => Ae(new Error("Failed to load image")), Ce.src = (ve = tt.target) == null ? void 0 : ve.result;
    }, Ne.onerror = () => Ae(new Error("Failed to read file")), Ne.readAsDataURL(N);
  }), K = async (N) => {
    if (n.value.length >= 3) {
      alert("Maximum 3 files allowed per message");
      return;
    }
    const tt = 3 - n.value.length, Ce = N.slice(0, tt);
    N.length > tt && alert(`Only ${tt} more file(s) can be uploaded. Maximum 3 files per message.`);
    for (const ve of Ce)
      try {
        if (n.value.some((le) => le.filename === ve.name)) {
          console.warn(`File ${ve.name} is already selected`), alert(`File "${ve.name}" is already selected`);
          continue;
        }
        const nt = ve.type.startsWith("image/"), lt = nt ? 5242880 : 10485760;
        if (ve.size > lt) {
          const le = lt / 1048576;
          console.error(`File ${ve.name} is too large. Maximum size is ${le}MB`), alert(`File "${ve.name}" is too large. Maximum size for ${nt ? "images" : "documents"} is ${le}MB`);
          continue;
        }
        if (nt)
          try {
            const { blob: le, base64: ge } = await M(ve, 500), ee = le.size;
            console.log(`Compressed ${ve.name}: ${(ve.size / 1024).toFixed(2)}KB → ${(ee / 1024).toFixed(2)}KB`), n.value.push({
              content: ge,
              filename: ve.name,
              type: ve.type,
              size: ee,
              url: URL.createObjectURL(le),
              file_url: URL.createObjectURL(le)
            });
          } catch (le) {
            console.error("Image compression failed, uploading original:", le);
            const ge = new FileReader();
            ge.onload = (ee) => {
              var de;
              const Re = ((de = ee.target) == null ? void 0 : de.result).split(",")[1];
              n.value.push({
                content: Re,
                filename: ve.name,
                type: ve.type,
                size: ve.size,
                url: URL.createObjectURL(ve),
                file_url: URL.createObjectURL(ve)
              });
            }, ge.readAsDataURL(ve);
          }
        else {
          const le = new FileReader();
          le.onload = (ge) => {
            var Re;
            const ot = ((Re = ge.target) == null ? void 0 : Re.result).split(",")[1];
            n.value.push({
              content: ot,
              filename: ve.name,
              type: ve.type || "application/octet-stream",
              size: ve.size,
              url: "",
              file_url: ""
            });
          }, le.readAsDataURL(ve);
        }
      } catch (Ge) {
        console.error("File upload error:", Ge);
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
    handleFileSelect: h,
    handleDrop: c,
    handleDragOver: w,
    handleDragLeave: _,
    handlePaste: P,
    uploadFiles: K,
    removeAttachment: async (N) => {
      const j = n.value[N];
      if (j) {
        try {
          let V = j.url;
          if (V.startsWith("/uploads/") ? V = V.substring(9) : V.startsWith("/") && (V = V.substring(1)), Ac(V))
            try {
              V = new URL(V).pathname.replace(/^\/+/, "");
            } catch {
            }
          const Ae = {};
          e.value && (Ae.Authorization = `Bearer ${e.value}`);
          const Ne = await fetch(`${js.API_URL}/files/upload/${V}`, {
            method: "DELETE",
            headers: Ae
          });
          if (Ne.ok)
            console.log("File deleted successfully from backend.");
          else {
            const tt = await Ne.json();
            console.error("Failed to delete file:", tt.detail);
          }
        } catch (V) {
          console.error("Error calling delete API:", V);
        }
        j.url && j.url.startsWith("blob:") && URL.revokeObjectURL(j.url), j.file_url && j.file_url.startsWith("blob:") && URL.revokeObjectURL(j.file_url), n.value.splice(N, 1);
      }
    },
    openPreview: (N) => {
      i.value = N, s.value = !0;
    },
    closePreview: () => {
      s.value = !1, setTimeout(() => {
        i.value = null;
      }, 300);
    },
    openFilePicker: () => {
      var N;
      (N = t.value) == null || N.click();
    },
    isImage: (N) => N.startsWith("image/")
  };
}
const fn = /* @__PURE__ */ Object.create(null);
fn.open = "0";
fn.close = "1";
fn.ping = "2";
fn.pong = "3";
fn.message = "4";
fn.upgrade = "5";
fn.noop = "6";
const wi = /* @__PURE__ */ Object.create(null);
Object.keys(fn).forEach((e) => {
  wi[fn[e]] = e;
});
const Vr = { type: "error", data: "parser error" }, Tc = typeof Blob == "function" || typeof Blob < "u" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]", Sc = typeof ArrayBuffer == "function", Ec = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e && e.buffer instanceof ArrayBuffer, To = ({ type: e, data: t }, n, s) => Tc && t instanceof Blob ? n ? s(t) : Va(t, s) : Sc && (t instanceof ArrayBuffer || Ec(t)) ? n ? s(t) : Va(new Blob([t]), s) : s(fn[e] + (t || "")), Va = (e, t) => {
  const n = new FileReader();
  return n.onload = function() {
    const s = n.result.split(",")[1];
    t("b" + (s || ""));
  }, n.readAsDataURL(e);
};
function Ka(e) {
  return e instanceof Uint8Array ? e : e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
}
let Ar;
function gp(e, t) {
  if (Tc && e.data instanceof Blob)
    return e.data.arrayBuffer().then(Ka).then(t);
  if (Sc && (e.data instanceof ArrayBuffer || Ec(e.data)))
    return t(Ka(e.data));
  To(e, !1, (n) => {
    Ar || (Ar = new TextEncoder()), t(Ar.encode(n));
  });
}
const Ga = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", Ls = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (let e = 0; e < Ga.length; e++)
  Ls[Ga.charCodeAt(e)] = e;
const mp = (e) => {
  let t = e.length * 0.75, n = e.length, s, i = 0, r, o, a, l;
  e[e.length - 1] === "=" && (t--, e[e.length - 2] === "=" && t--);
  const h = new ArrayBuffer(t), c = new Uint8Array(h);
  for (s = 0; s < n; s += 4)
    r = Ls[e.charCodeAt(s)], o = Ls[e.charCodeAt(s + 1)], a = Ls[e.charCodeAt(s + 2)], l = Ls[e.charCodeAt(s + 3)], c[i++] = r << 2 | o >> 4, c[i++] = (o & 15) << 4 | a >> 2, c[i++] = (a & 3) << 6 | l & 63;
  return h;
}, _p = typeof ArrayBuffer == "function", So = (e, t) => {
  if (typeof e != "string")
    return {
      type: "message",
      data: Cc(e, t)
    };
  const n = e.charAt(0);
  return n === "b" ? {
    type: "message",
    data: yp(e.substring(1), t)
  } : wi[n] ? e.length > 1 ? {
    type: wi[n],
    data: e.substring(1)
  } : {
    type: wi[n]
  } : Vr;
}, yp = (e, t) => {
  if (_p) {
    const n = mp(e);
    return Cc(n, t);
  } else
    return { base64: !0, data: e };
}, Cc = (e, t) => {
  switch (t) {
    case "blob":
      return e instanceof Blob ? e : new Blob([e]);
    case "arraybuffer":
    default:
      return e instanceof ArrayBuffer ? e : e.buffer;
  }
}, Rc = "", vp = (e, t) => {
  const n = e.length, s = new Array(n);
  let i = 0;
  e.forEach((r, o) => {
    To(r, !1, (a) => {
      s[o] = a, ++i === n && t(s.join(Rc));
    });
  });
}, bp = (e, t) => {
  const n = e.split(Rc), s = [];
  for (let i = 0; i < n.length; i++) {
    const r = So(n[i], t);
    if (s.push(r), r.type === "error")
      break;
  }
  return s;
};
function wp() {
  return new TransformStream({
    transform(e, t) {
      gp(e, (n) => {
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
let Tr;
function ui(e) {
  return e.reduce((t, n) => t + n.length, 0);
}
function fi(e, t) {
  if (e[0].length === t)
    return e.shift();
  const n = new Uint8Array(t);
  let s = 0;
  for (let i = 0; i < t; i++)
    n[i] = e[0][s++], s === e[0].length && (e.shift(), s = 0);
  return e.length && s < e[0].length && (e[0] = e[0].slice(s)), n;
}
function kp(e, t) {
  Tr || (Tr = new TextDecoder());
  const n = [];
  let s = 0, i = -1, r = !1;
  return new TransformStream({
    transform(o, a) {
      for (n.push(o); ; ) {
        if (s === 0) {
          if (ui(n) < 1)
            break;
          const l = fi(n, 1);
          r = (l[0] & 128) === 128, i = l[0] & 127, i < 126 ? s = 3 : i === 126 ? s = 1 : s = 2;
        } else if (s === 1) {
          if (ui(n) < 2)
            break;
          const l = fi(n, 2);
          i = new DataView(l.buffer, l.byteOffset, l.length).getUint16(0), s = 3;
        } else if (s === 2) {
          if (ui(n) < 8)
            break;
          const l = fi(n, 8), h = new DataView(l.buffer, l.byteOffset, l.length), c = h.getUint32(0);
          if (c > Math.pow(2, 21) - 1) {
            a.enqueue(Vr);
            break;
          }
          i = c * Math.pow(2, 32) + h.getUint32(4), s = 3;
        } else {
          if (ui(n) < i)
            break;
          const l = fi(n, i);
          a.enqueue(So(r ? l : Tr.decode(l), t)), s = 0;
        }
        if (i === 0 || i > e) {
          a.enqueue(Vr);
          break;
        }
      }
    }
  });
}
const Ic = 4;
function dt(e) {
  if (e) return xp(e);
}
function xp(e) {
  for (var t in dt.prototype)
    e[t] = dt.prototype[t];
  return e;
}
dt.prototype.on = dt.prototype.addEventListener = function(e, t) {
  return this._callbacks = this._callbacks || {}, (this._callbacks["$" + e] = this._callbacks["$" + e] || []).push(t), this;
};
dt.prototype.once = function(e, t) {
  function n() {
    this.off(e, n), t.apply(this, arguments);
  }
  return n.fn = t, this.on(e, n), this;
};
dt.prototype.off = dt.prototype.removeListener = dt.prototype.removeAllListeners = dt.prototype.removeEventListener = function(e, t) {
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
dt.prototype.emit = function(e) {
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
dt.prototype.emitReserved = dt.prototype.emit;
dt.prototype.listeners = function(e) {
  return this._callbacks = this._callbacks || {}, this._callbacks["$" + e] || [];
};
dt.prototype.hasListeners = function(e) {
  return !!this.listeners(e).length;
};
const Zi = typeof Promise == "function" && typeof Promise.resolve == "function" ? (t) => Promise.resolve().then(t) : (t, n) => n(t, 0), qt = typeof self < "u" ? self : typeof window < "u" ? window : Function("return this")(), Ap = "arraybuffer";
function Lc(e, ...t) {
  return t.reduce((n, s) => (e.hasOwnProperty(s) && (n[s] = e[s]), n), {});
}
const Tp = qt.setTimeout, Sp = qt.clearTimeout;
function Ji(e, t) {
  t.useNativeTimers ? (e.setTimeoutFn = Tp.bind(qt), e.clearTimeoutFn = Sp.bind(qt)) : (e.setTimeoutFn = qt.setTimeout.bind(qt), e.clearTimeoutFn = qt.clearTimeout.bind(qt));
}
const Ep = 1.33;
function Cp(e) {
  return typeof e == "string" ? Rp(e) : Math.ceil((e.byteLength || e.size) * Ep);
}
function Rp(e) {
  let t = 0, n = 0;
  for (let s = 0, i = e.length; s < i; s++)
    t = e.charCodeAt(s), t < 128 ? n += 1 : t < 2048 ? n += 2 : t < 55296 || t >= 57344 ? n += 3 : (s++, n += 4);
  return n;
}
function Oc() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
function Ip(e) {
  let t = "";
  for (let n in e)
    e.hasOwnProperty(n) && (t.length && (t += "&"), t += encodeURIComponent(n) + "=" + encodeURIComponent(e[n]));
  return t;
}
function Lp(e) {
  let t = {}, n = e.split("&");
  for (let s = 0, i = n.length; s < i; s++) {
    let r = n[s].split("=");
    t[decodeURIComponent(r[0])] = decodeURIComponent(r[1]);
  }
  return t;
}
class Op extends Error {
  constructor(t, n, s) {
    super(t), this.description = n, this.context = s, this.type = "TransportError";
  }
}
class Eo extends dt {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} opts - options
   * @protected
   */
  constructor(t) {
    super(), this.writable = !1, Ji(this, t), this.opts = t, this.query = t.query, this.socket = t.socket, this.supportsBinary = !t.forceBase64;
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
    return super.emitReserved("error", new Op(t, n, s)), this;
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
    const n = So(t, this.socket.binaryType);
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
    const n = Ip(t);
    return n.length ? "?" + n : "";
  }
}
class Pp extends Eo {
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
    bp(t, this.socket.binaryType).forEach(n), this.readyState !== "closed" && (this._polling = !1, this.emitReserved("pollComplete"), this.readyState === "open" && this._poll());
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
    this.writable = !1, vp(t, (n) => {
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
    return this.opts.timestampRequests !== !1 && (n[this.opts.timestampParam] = Oc()), !this.supportsBinary && !n.sid && (n.b64 = 1), this.createUri(t, n);
  }
}
let Pc = !1;
try {
  Pc = typeof XMLHttpRequest < "u" && "withCredentials" in new XMLHttpRequest();
} catch {
}
const Mp = Pc;
function Np() {
}
class Fp extends Pp {
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
class cn extends dt {
  /**
   * Request constructor
   *
   * @param {Object} options
   * @package
   */
  constructor(t, n, s) {
    super(), this.createRequest = t, Ji(this, s), this._opts = s, this._method = s.method || "GET", this._uri = n, this._data = s.data !== void 0 ? s.data : null, this._create();
  }
  /**
   * Creates the XHR object and sends the request.
   *
   * @private
   */
  _create() {
    var t;
    const n = Lc(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
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
    typeof document < "u" && (this._index = cn.requestsCount++, cn.requests[this._index] = this);
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
      if (this._xhr.onreadystatechange = Np, t)
        try {
          this._xhr.abort();
        } catch {
        }
      typeof document < "u" && delete cn.requests[this._index], this._xhr = null;
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
cn.requestsCount = 0;
cn.requests = {};
if (typeof document < "u") {
  if (typeof attachEvent == "function")
    attachEvent("onunload", Ya);
  else if (typeof addEventListener == "function") {
    const e = "onpagehide" in qt ? "pagehide" : "unload";
    addEventListener(e, Ya, !1);
  }
}
function Ya() {
  for (let e in cn.requests)
    cn.requests.hasOwnProperty(e) && cn.requests[e].abort();
}
const Dp = function() {
  const e = Mc({
    xdomain: !1
  });
  return e && e.responseType !== null;
}();
class Bp extends Fp {
  constructor(t) {
    super(t);
    const n = t && t.forceBase64;
    this.supportsBinary = Dp && !n;
  }
  request(t = {}) {
    return Object.assign(t, { xd: this.xd }, this.opts), new cn(Mc, this.uri(), t);
  }
}
function Mc(e) {
  const t = e.xdomain;
  try {
    if (typeof XMLHttpRequest < "u" && (!t || Mp))
      return new XMLHttpRequest();
  } catch {
  }
  if (!t)
    try {
      return new qt[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch {
    }
}
const Nc = typeof navigator < "u" && typeof navigator.product == "string" && navigator.product.toLowerCase() === "reactnative";
class $p extends Eo {
  get name() {
    return "websocket";
  }
  doOpen() {
    const t = this.uri(), n = this.opts.protocols, s = Nc ? {} : Lc(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
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
      To(s, this.supportsBinary, (r) => {
        try {
          this.doWrite(s, r);
        } catch {
        }
        i && Zi(() => {
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
    return this.opts.timestampRequests && (n[this.opts.timestampParam] = Oc()), this.supportsBinary || (n.b64 = 1), this.createUri(t, n);
  }
}
const Sr = qt.WebSocket || qt.MozWebSocket;
class Up extends $p {
  createSocket(t, n, s) {
    return Nc ? new Sr(t, n, s) : n ? new Sr(t, n) : new Sr(t);
  }
  doWrite(t, n) {
    this.ws.send(n);
  }
}
class zp extends Eo {
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
        const n = kp(Number.MAX_SAFE_INTEGER, this.socket.binaryType), s = t.readable.pipeThrough(n).getReader(), i = wp();
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
        i && Zi(() => {
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
const Hp = {
  websocket: Up,
  webtransport: zp,
  polling: Bp
}, qp = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, Wp = [
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
function Kr(e) {
  if (e.length > 8e3)
    throw "URI too long";
  const t = e, n = e.indexOf("["), s = e.indexOf("]");
  n != -1 && s != -1 && (e = e.substring(0, n) + e.substring(n, s).replace(/:/g, ";") + e.substring(s, e.length));
  let i = qp.exec(e || ""), r = {}, o = 14;
  for (; o--; )
    r[Wp[o]] = i[o] || "";
  return n != -1 && s != -1 && (r.source = t, r.host = r.host.substring(1, r.host.length - 1).replace(/;/g, ":"), r.authority = r.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), r.ipv6uri = !0), r.pathNames = jp(r, r.path), r.queryKey = Vp(r, r.query), r;
}
function jp(e, t) {
  const n = /\/{2,9}/g, s = t.replace(n, "/").split("/");
  return (t.slice(0, 1) == "/" || t.length === 0) && s.splice(0, 1), t.slice(-1) == "/" && s.splice(s.length - 1, 1), s;
}
function Vp(e, t) {
  const n = {};
  return t.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(s, i, r) {
    i && (n[i] = r);
  }), n;
}
const Gr = typeof addEventListener == "function" && typeof removeEventListener == "function", ki = [];
Gr && addEventListener("offline", () => {
  ki.forEach((e) => e());
}, !1);
class Cn extends dt {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri - uri or options
   * @param {Object} opts - options
   */
  constructor(t, n) {
    if (super(), this.binaryType = Ap, this.writeBuffer = [], this._prevBufferLen = 0, this._pingInterval = -1, this._pingTimeout = -1, this._maxPayload = -1, this._pingTimeoutTime = 1 / 0, t && typeof t == "object" && (n = t, t = null), t) {
      const s = Kr(t);
      n.hostname = s.host, n.secure = s.protocol === "https" || s.protocol === "wss", n.port = s.port, s.query && (n.query = s.query);
    } else n.host && (n.hostname = Kr(n.host).host);
    Ji(this, n), this.secure = n.secure != null ? n.secure : typeof location < "u" && location.protocol === "https:", n.hostname && !n.port && (n.port = this.secure ? "443" : "80"), this.hostname = n.hostname || (typeof location < "u" ? location.hostname : "localhost"), this.port = n.port || (typeof location < "u" && location.port ? location.port : this.secure ? "443" : "80"), this.transports = [], this._transportsByName = {}, n.transports.forEach((s) => {
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
    }, n), this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : ""), typeof this.opts.query == "string" && (this.opts.query = Lp(this.opts.query)), Gr && (this.opts.closeOnBeforeunload && (this._beforeunloadEventListener = () => {
      this.transport && (this.transport.removeAllListeners(), this.transport.close());
    }, addEventListener("beforeunload", this._beforeunloadEventListener, !1)), this.hostname !== "localhost" && (this._offlineEventListener = () => {
      this._onClose("transport close", {
        description: "network connection lost"
      });
    }, ki.push(this._offlineEventListener))), this.opts.withCredentials && (this._cookieJar = void 0), this._open();
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
    n.EIO = Ic, n.transport = t, this.id && (n.sid = this.id);
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
    const t = this.opts.rememberUpgrade && Cn.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
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
    this.readyState = "open", Cn.priorWebsocketSuccess = this.transport.name === "websocket", this.emitReserved("open"), this.flush();
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
      if (i && (n += Cp(i)), s > 0 && n > this._maxPayload)
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
    return t && (this._pingTimeoutTime = 0, Zi(() => {
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
    if (Cn.priorWebsocketSuccess = !1, this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening")
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
      if (this.clearTimeoutFn(this._pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), Gr && (this._beforeunloadEventListener && removeEventListener("beforeunload", this._beforeunloadEventListener, !1), this._offlineEventListener)) {
        const s = ki.indexOf(this._offlineEventListener);
        s !== -1 && ki.splice(s, 1);
      }
      this.readyState = "closed", this.id = null, this.emitReserved("close", t, n), this.writeBuffer = [], this._prevBufferLen = 0;
    }
  }
}
Cn.protocol = Ic;
class Kp extends Cn {
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
    Cn.priorWebsocketSuccess = !1;
    const i = () => {
      s || (n.send([{ type: "ping", data: "probe" }]), n.once("packet", (w) => {
        if (!s)
          if (w.type === "pong" && w.data === "probe") {
            if (this.upgrading = !0, this.emitReserved("upgrading", n), !n)
              return;
            Cn.priorWebsocketSuccess = n.name === "websocket", this.transport.pause(() => {
              s || this.readyState !== "closed" && (c(), this.setTransport(n), n.send([{ type: "upgrade" }]), this.emitReserved("upgrade", n), n = null, this.upgrading = !1, this.flush());
            });
          } else {
            const _ = new Error("probe error");
            _.transport = n.name, this.emitReserved("upgradeError", _);
          }
      }));
    };
    function r() {
      s || (s = !0, c(), n.close(), n = null);
    }
    const o = (w) => {
      const _ = new Error("probe error: " + w);
      _.transport = n.name, r(), this.emitReserved("upgradeError", _);
    };
    function a() {
      o("transport closed");
    }
    function l() {
      o("socket closed");
    }
    function h(w) {
      n && w.name !== n.name && r();
    }
    const c = () => {
      n.removeListener("open", i), n.removeListener("error", o), n.removeListener("close", a), this.off("close", l), this.off("upgrading", h);
    };
    n.once("open", i), n.once("error", o), n.once("close", a), this.once("close", l), this.once("upgrading", h), this._upgrades.indexOf("webtransport") !== -1 && t !== "webtransport" ? this.setTimeoutFn(() => {
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
let Gp = class extends Kp {
  constructor(t, n = {}) {
    const s = typeof t == "object" ? t : n;
    (!s.transports || s.transports && typeof s.transports[0] == "string") && (s.transports = (s.transports || ["polling", "websocket", "webtransport"]).map((i) => Hp[i]).filter((i) => !!i)), super(t, s);
  }
};
function Yp(e, t = "", n) {
  let s = e;
  n = n || typeof location < "u" && location, e == null && (e = n.protocol + "//" + n.host), typeof e == "string" && (e.charAt(0) === "/" && (e.charAt(1) === "/" ? e = n.protocol + e : e = n.host + e), /^(https?|wss?):\/\//.test(e) || (typeof n < "u" ? e = n.protocol + "//" + e : e = "https://" + e), s = Kr(e)), s.port || (/^(http|ws)$/.test(s.protocol) ? s.port = "80" : /^(http|ws)s$/.test(s.protocol) && (s.port = "443")), s.path = s.path || "/";
  const r = s.host.indexOf(":") !== -1 ? "[" + s.host + "]" : s.host;
  return s.id = s.protocol + "://" + r + ":" + s.port + t, s.href = s.protocol + "://" + r + (n && n.port === s.port ? "" : ":" + s.port), s;
}
const Xp = typeof ArrayBuffer == "function", Zp = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e.buffer instanceof ArrayBuffer, Fc = Object.prototype.toString, Jp = typeof Blob == "function" || typeof Blob < "u" && Fc.call(Blob) === "[object BlobConstructor]", Qp = typeof File == "function" || typeof File < "u" && Fc.call(File) === "[object FileConstructor]";
function Co(e) {
  return Xp && (e instanceof ArrayBuffer || Zp(e)) || Jp && e instanceof Blob || Qp && e instanceof File;
}
function xi(e, t) {
  if (!e || typeof e != "object")
    return !1;
  if (Array.isArray(e)) {
    for (let n = 0, s = e.length; n < s; n++)
      if (xi(e[n]))
        return !0;
    return !1;
  }
  if (Co(e))
    return !0;
  if (e.toJSON && typeof e.toJSON == "function" && arguments.length === 1)
    return xi(e.toJSON(), !0);
  for (const n in e)
    if (Object.prototype.hasOwnProperty.call(e, n) && xi(e[n]))
      return !0;
  return !1;
}
function eg(e) {
  const t = [], n = e.data, s = e;
  return s.data = Yr(n, t), s.attachments = t.length, { packet: s, buffers: t };
}
function Yr(e, t) {
  if (!e)
    return e;
  if (Co(e)) {
    const n = { _placeholder: !0, num: t.length };
    return t.push(e), n;
  } else if (Array.isArray(e)) {
    const n = new Array(e.length);
    for (let s = 0; s < e.length; s++)
      n[s] = Yr(e[s], t);
    return n;
  } else if (typeof e == "object" && !(e instanceof Date)) {
    const n = {};
    for (const s in e)
      Object.prototype.hasOwnProperty.call(e, s) && (n[s] = Yr(e[s], t));
    return n;
  }
  return e;
}
function tg(e, t) {
  return e.data = Xr(e.data, t), delete e.attachments, e;
}
function Xr(e, t) {
  if (!e)
    return e;
  if (e && e._placeholder === !0) {
    if (typeof e.num == "number" && e.num >= 0 && e.num < t.length)
      return t[e.num];
    throw new Error("illegal attachments");
  } else if (Array.isArray(e))
    for (let n = 0; n < e.length; n++)
      e[n] = Xr(e[n], t);
  else if (typeof e == "object")
    for (const n in e)
      Object.prototype.hasOwnProperty.call(e, n) && (e[n] = Xr(e[n], t));
  return e;
}
const ng = [
  "connect",
  "connect_error",
  "disconnect",
  "disconnecting",
  "newListener",
  "removeListener"
  // used by the Node.js EventEmitter
];
var Le;
(function(e) {
  e[e.CONNECT = 0] = "CONNECT", e[e.DISCONNECT = 1] = "DISCONNECT", e[e.EVENT = 2] = "EVENT", e[e.ACK = 3] = "ACK", e[e.CONNECT_ERROR = 4] = "CONNECT_ERROR", e[e.BINARY_EVENT = 5] = "BINARY_EVENT", e[e.BINARY_ACK = 6] = "BINARY_ACK";
})(Le || (Le = {}));
class sg {
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
    return (t.type === Le.EVENT || t.type === Le.ACK) && xi(t) ? this.encodeAsBinary({
      type: t.type === Le.EVENT ? Le.BINARY_EVENT : Le.BINARY_ACK,
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
    return (t.type === Le.BINARY_EVENT || t.type === Le.BINARY_ACK) && (n += t.attachments + "-"), t.nsp && t.nsp !== "/" && (n += t.nsp + ","), t.id != null && (n += t.id), t.data != null && (n += JSON.stringify(t.data, this.replacer)), n;
  }
  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   */
  encodeAsBinary(t) {
    const n = eg(t), s = this.encodeAsString(n.packet), i = n.buffers;
    return i.unshift(s), i;
  }
}
function Xa(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
class Ro extends dt {
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
      const s = n.type === Le.BINARY_EVENT;
      s || n.type === Le.BINARY_ACK ? (n.type = s ? Le.EVENT : Le.ACK, this.reconstructor = new ig(n), n.attachments === 0 && super.emitReserved("decoded", n)) : super.emitReserved("decoded", n);
    } else if (Co(t) || t.base64)
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
    if (Le[s.type] === void 0)
      throw new Error("unknown packet type " + s.type);
    if (s.type === Le.BINARY_EVENT || s.type === Le.BINARY_ACK) {
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
      if (Ro.isPayloadValid(s.type, r))
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
      case Le.CONNECT:
        return Xa(n);
      case Le.DISCONNECT:
        return n === void 0;
      case Le.CONNECT_ERROR:
        return typeof n == "string" || Xa(n);
      case Le.EVENT:
      case Le.BINARY_EVENT:
        return Array.isArray(n) && (typeof n[0] == "number" || typeof n[0] == "string" && ng.indexOf(n[0]) === -1);
      case Le.ACK:
      case Le.BINARY_ACK:
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
class ig {
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
      const n = tg(this.reconPack, this.buffers);
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
const rg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Decoder: Ro,
  Encoder: sg,
  get PacketType() {
    return Le;
  }
}, Symbol.toStringTag, { value: "Module" }));
function Qt(e, t, n) {
  return e.on(t, n), function() {
    e.off(t, n);
  };
}
const og = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
  newListener: 1,
  removeListener: 1
});
class Dc extends dt {
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
      Qt(t, "open", this.onopen.bind(this)),
      Qt(t, "packet", this.onpacket.bind(this)),
      Qt(t, "error", this.onerror.bind(this)),
      Qt(t, "close", this.onclose.bind(this))
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
    if (og.hasOwnProperty(t))
      throw new Error('"' + t.toString() + '" is a reserved event name');
    if (n.unshift(t), this._opts.retries && !this.flags.fromQueue && !this.flags.volatile)
      return this._addToQueue(n), this;
    const o = {
      type: Le.EVENT,
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
      type: Le.CONNECT,
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
        case Le.CONNECT:
          t.data && t.data.sid ? this.onconnect(t.data.sid, t.data.pid) : this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          break;
        case Le.EVENT:
        case Le.BINARY_EVENT:
          this.onevent(t);
          break;
        case Le.ACK:
        case Le.BINARY_ACK:
          this.onack(t);
          break;
        case Le.DISCONNECT:
          this.ondisconnect();
          break;
        case Le.CONNECT_ERROR:
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
        type: Le.ACK,
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
    return this.connected && this.packet({ type: Le.DISCONNECT }), this.destroy(), this.connected && this.onclose("io client disconnect"), this;
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
class Zr extends dt {
  constructor(t, n) {
    var s;
    super(), this.nsps = {}, this.subs = [], t && typeof t == "object" && (n = t, t = void 0), n = n || {}, n.path = n.path || "/socket.io", this.opts = n, Ji(this, n), this.reconnection(n.reconnection !== !1), this.reconnectionAttempts(n.reconnectionAttempts || 1 / 0), this.reconnectionDelay(n.reconnectionDelay || 1e3), this.reconnectionDelayMax(n.reconnectionDelayMax || 5e3), this.randomizationFactor((s = n.randomizationFactor) !== null && s !== void 0 ? s : 0.5), this.backoff = new us({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    }), this.timeout(n.timeout == null ? 2e4 : n.timeout), this._readyState = "closed", this.uri = t;
    const i = n.parser || rg;
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
    this.engine = new Gp(this.uri, this.opts);
    const n = this.engine, s = this;
    this._readyState = "opening", this.skipReconnect = !1;
    const i = Qt(n, "open", function() {
      s.onopen(), t && t();
    }), r = (a) => {
      this.cleanup(), this._readyState = "closed", this.emitReserved("error", a), t ? t(a) : this.maybeReconnectOnOpen();
    }, o = Qt(n, "error", r);
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
      Qt(t, "ping", this.onping.bind(this)),
      Qt(t, "data", this.ondata.bind(this)),
      Qt(t, "error", this.onerror.bind(this)),
      Qt(t, "close", this.onclose.bind(this)),
      // @ts-ignore
      Qt(this.decoder, "decoded", this.ondecoded.bind(this))
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
    Zi(() => {
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
    return s ? this._autoConnect && !s.active && s.connect() : (s = new Dc(this, t, n), this.nsps[t] = s), s;
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
const Es = {};
function Ai(e, t) {
  typeof e == "object" && (t = e, e = void 0), t = t || {};
  const n = Yp(e, t.path || "/socket.io"), s = n.source, i = n.id, r = n.path, o = Es[i] && r in Es[i].nsps, a = t.forceNew || t["force new connection"] || t.multiplex === !1 || o;
  let l;
  return a ? l = new Zr(s, t) : (Es[i] || (Es[i] = new Zr(s, t)), l = Es[i]), n.query && !t.query && (t.query = n.queryKey), l.socket(n.path, t);
}
Object.assign(Ai, {
  Manager: Zr,
  Socket: Dc,
  io: Ai,
  connect: Ai
});
function ag() {
  const e = oe([]), t = oe(!1), n = oe(""), s = oe(!1), i = oe(!1), r = oe(!1), o = oe("connecting"), a = oe(0), l = 5, h = oe({}), c = oe(null), w = oe("");
  let _ = null, P = null, M = null, K = null, Me, fe;
  const _e = (q) => {
    Me = q, q && localStorage.setItem("ctid", q);
  }, be = (q) => {
    fe = q;
  }, k = (q) => {
    var Fe;
    const me = Me || localStorage.getItem("ctid"), ae = {};
    me && (ae.conversation_token = me), fe && (ae.widget_id = fe);
    try {
      ae.page_url = window.parent !== window && ((Fe = window.parent.location) != null && Fe.href) ? window.parent.location.href : document.referrer || window.location.href;
    } catch {
      ae.page_url = document.referrer || "";
    }
    return _ = Ai(`${js.WS_URL}/widget`, {
      transports: ["websocket"],
      reconnection: !0,
      reconnectionAttempts: l,
      reconnectionDelay: 1e3,
      auth: Object.keys(ae).length > 0 ? ae : void 0
    }), _.on("connect", () => {
      o.value = "connected", a.value = 0;
    }), _.on("disconnect", () => {
      o.value === "connected" && (console.log("Socket disconnected, setting connection status to connecting"), o.value = "connecting");
    }), _.on("connect_error", () => {
      a.value++, console.error("Socket connection failed, attempt:", a.value, "connection status:", o.value), a.value >= l && (o.value = "failed");
    }), _.on("chat_response", (G) => {
      if (t.value = !1, G.session_id ? (console.log("Captured session_id from chat_response:", G.session_id), w.value = G.session_id) : console.warn("No session_id in chat_response data:", G), G.type === "agent_message") {
        const Xe = {
          message: G.message,
          message_type: "agent",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          session_id: "",
          agent_name: G.agent_name,
          stream: !0,
          // live reply → client-side typewriter reveal
          attributes: {
            end_chat: G.end_chat,
            end_chat_reason: G.end_chat_reason,
            end_chat_description: G.end_chat_description,
            request_rating: G.request_rating
          }
        };
        G.attachments && Array.isArray(G.attachments) && (Xe.id = G.message_id, Xe.attachments = G.attachments.map((ct, At) => ({
          id: G.message_id * 1e3 + At,
          filename: ct.filename,
          file_url: ct.file_url,
          content_type: ct.content_type,
          file_size: ct.file_size
        }))), e.value.push(Xe);
      } else G.shopify_output && typeof G.shopify_output == "object" && G.shopify_output.products ? e.value.push({
        message: G.message,
        // Keep the accompanying text message
        message_type: "product",
        // Use 'product' type for rendering
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: "",
        agent_name: G.agent_name,
        // Assign the whole structured object
        shopify_output: G.shopify_output,
        // Remove the old flattened fields (product_id, product_title, etc.)
        attributes: {
          // Keep other attributes if needed
          end_chat: G.end_chat,
          request_rating: G.request_rating
        }
      }) : e.value.push({
        message: G.message,
        message_type: "bot",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: "",
        agent_name: G.agent_name,
        stream: !0,
        // live reply → client-side typewriter reveal
        // Knowledge-base citations (display gated by show_citations in the widget)
        sources: Array.isArray(G.sources) && G.sources.length ? G.sources : void 0,
        attributes: {
          end_chat: G.end_chat,
          end_chat_reason: G.end_chat_reason,
          end_chat_description: G.end_chat_description,
          request_rating: G.request_rating
        }
      });
    }), _.on("handle_taken_over", (G) => {
      e.value.push({
        message: `${G.user_name} joined the conversation`,
        message_type: "system",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: G.session_id
      }), h.value = {
        ...h.value,
        human_agent_name: G.user_name,
        human_agent_profile_pic: G.profile_picture
      }, P && P(G);
    }), _.on("session_initialized", (G) => {
      G.session_id && (console.log("Initialized session_id from session_initialized:", G.session_id), w.value = G.session_id);
    }), _.on("error", tt), _.on("chat_history", Ce), _.on("rating_submitted", ve), _.on("display_form", Ge), _.on("form_submitted", nt), _.on("workflow_state", lt), _.on("workflow_proceeded", le), _;
  }, N = async () => {
    try {
      return o.value = "connecting", a.value = 0, _ && (_.removeAllListeners(), _.disconnect(), _ = null), _ = k(""), new Promise((q) => {
        _ == null || _.on("connect", () => {
          q(!0);
        }), _ == null || _.on("connect_error", () => {
          a.value >= l && q(!1);
        });
      });
    } catch (q) {
      return console.error("Socket initialization failed:", q), o.value = "failed", !1;
    }
  }, j = () => (_ && _.disconnect(), N()), V = (q) => {
    P = q;
  }, Ae = (q) => {
    M = q;
  }, Ne = (q) => {
    K = q;
  }, tt = (q) => {
    t.value = !1, n.value = Nh(q), s.value = !0, setTimeout(() => {
      s.value = !1, n.value = "";
    }, 5e3);
  }, Ce = (q) => {
    if (q.type === "chat_history" && Array.isArray(q.messages)) {
      const me = q.messages.map((ae) => {
        var G, Xe;
        const Fe = {
          message: ae.message,
          message_type: ae.message_type,
          created_at: ae.created_at,
          session_id: "",
          agent_name: ae.agent_name || "",
          user_name: ae.user_name || "",
          attributes: ae.attributes || {},
          attachments: ae.attachments || []
          // Include attachments
        };
        return Array.isArray((G = ae.attributes) == null ? void 0 : G.sources) && ae.attributes.sources.length && (Fe.sources = ae.attributes.sources), (Xe = ae.attributes) != null && Xe.shopify_output && typeof ae.attributes.shopify_output == "object" ? {
          ...Fe,
          message_type: "product",
          shopify_output: ae.attributes.shopify_output
        } : Fe;
      });
      e.value = [
        ...me.filter(
          (ae) => !e.value.some(
            (Fe) => Fe.message === ae.message && Fe.created_at === ae.created_at
          )
        ),
        ...e.value
      ];
    }
  }, ve = (q) => {
    q.success && e.value.push({
      message: "Thank you for your feedback!",
      message_type: "system",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: ""
    });
  }, Ge = (q) => {
    var me;
    console.log("Form display handler in composable:", q), t.value = !1, c.value = q.form_data, console.log("Set currentForm in handleDisplayForm:", c.value), ((me = q.form_data) == null ? void 0 : me.form_full_screen) === !0 ? (console.log("Full screen form detected, triggering workflow state callback"), M && M({
      type: "form",
      form_data: q.form_data,
      session_id: q.session_id
    })) : e.value.push({
      message: "",
      message_type: "form",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: q.session_id,
      attributes: {
        form_data: q.form_data
      }
    });
  }, nt = (q) => {
    console.log("Form submitted confirmation received, clearing currentForm"), c.value = null, q.success && console.log("Form submitted successfully");
  }, lt = (q) => {
    console.log("Workflow state received in composable:", q), (q.type === "form" || q.type === "display_form") && (console.log("Setting currentForm from workflow state:", q.form_data), c.value = q.form_data), M && M(q);
  }, le = (q) => {
    console.log("Workflow proceeded in composable:", q), K && K(q);
  };
  return {
    messages: e,
    loading: t,
    errorMessage: n,
    showError: s,
    loadingHistory: i,
    hasStartedChat: r,
    connectionStatus: o,
    sendMessage: async (q, me, ae = []) => {
      if (!_ || !q.trim() && ae.length === 0) return;
      h.value.human_agent_name || (t.value = !0);
      const Fe = {
        message: q,
        message_type: "user",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: ""
      };
      ae.length > 0 && (Fe.attachments = ae.map((G, Xe) => {
        let ct = "";
        if (G.content_type.startsWith("image/")) {
          const At = atob(G.content), g = new Array(At.length);
          for (let I = 0; I < At.length; I++)
            g[I] = At.charCodeAt(I);
          const y = new Uint8Array(g), A = new Blob([y], { type: G.content_type });
          ct = URL.createObjectURL(A);
        }
        return {
          id: Date.now() * 1e3 + Xe,
          // Temporary ID
          filename: G.filename,
          file_url: ct,
          // Temporary blob URL, will be replaced
          content_type: G.content_type,
          file_size: G.size,
          _isTemporary: !0
          // Flag to identify temporary attachments
        };
      })), e.value.push(Fe), _.emit("chat", {
        message: q,
        email: me,
        files: ae
        // Send files with base64 content
      }), r.value = !0;
    },
    loadChatHistory: async () => {
      if (_)
        try {
          i.value = !0, _.emit("get_chat_history");
        } catch (q) {
          console.error("Failed to load chat history:", q);
        } finally {
          i.value = !1;
        }
    },
    connect: N,
    reconnect: j,
    cleanup: () => {
      _ && (_.removeAllListeners(), _.disconnect(), _ = null), P = null, M = null, K = null;
    },
    humanAgent: h,
    onTakeover: V,
    submitRating: async (q, me) => {
      !_ || !q || _.emit("submit_rating", {
        rating: q,
        feedback: me
      });
    },
    currentForm: c,
    submitForm: async (q) => {
      var Fe;
      if (console.log("Submitting form in socket:", q), console.log("Current form in socket:", c.value), console.log("Socket in socket:", _), !_) {
        console.error("No socket available for form submission");
        return;
      }
      if (!q || Object.keys(q).length === 0) {
        console.error("No form data to submit");
        return;
      }
      const ae = ((Fe = c.value) == null ? void 0 : Fe.form_type) === "contact" ? "submit_contact_info" : "submit_form";
      console.log(`Emitting ${ae} event with data:`, q), _.emit(ae, {
        form_data: q
      }), c.value = null;
    },
    getWorkflowState: async () => {
      _ && (console.log("Getting workflow state 12"), _.emit("get_workflow_state"));
    },
    proceedWorkflow: async () => {
      _ && _.emit("proceed_workflow", {});
    },
    onWorkflowState: Ae,
    onWorkflowProceeded: Ne,
    currentSessionId: w,
    setToken: _e,
    setWidgetId: be
  };
}
function lg(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Er = { exports: {} }, Za;
function cg() {
  return Za || (Za = 1, function(e) {
    (function() {
      function t(f, v, C) {
        return f.call.apply(f.bind, arguments);
      }
      function n(f, v, C) {
        if (!f) throw Error();
        if (2 < arguments.length) {
          var S = Array.prototype.slice.call(arguments, 2);
          return function() {
            var D = Array.prototype.slice.call(arguments);
            return Array.prototype.unshift.apply(D, S), f.apply(v, D);
          };
        }
        return function() {
          return f.apply(v, arguments);
        };
      }
      function s(f, v, C) {
        return s = Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1 ? t : n, s.apply(null, arguments);
      }
      var i = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      function r(f, v) {
        this.a = f, this.o = v || f, this.c = this.o.document;
      }
      var o = !!window.FontFace;
      function a(f, v, C, S) {
        if (v = f.c.createElement(v), C) for (var D in C) C.hasOwnProperty(D) && (D == "style" ? v.style.cssText = C[D] : v.setAttribute(D, C[D]));
        return S && v.appendChild(f.c.createTextNode(S)), v;
      }
      function l(f, v, C) {
        f = f.c.getElementsByTagName(v)[0], f || (f = document.documentElement), f.insertBefore(C, f.lastChild);
      }
      function h(f) {
        f.parentNode && f.parentNode.removeChild(f);
      }
      function c(f, v, C) {
        v = v || [], C = C || [];
        for (var S = f.className.split(/\s+/), D = 0; D < v.length; D += 1) {
          for (var X = !1, se = 0; se < S.length; se += 1) if (v[D] === S[se]) {
            X = !0;
            break;
          }
          X || S.push(v[D]);
        }
        for (v = [], D = 0; D < S.length; D += 1) {
          for (X = !1, se = 0; se < C.length; se += 1) if (S[D] === C[se]) {
            X = !0;
            break;
          }
          X || v.push(S[D]);
        }
        f.className = v.join(" ").replace(/\s+/g, " ").replace(/^\s+|\s+$/, "");
      }
      function w(f, v) {
        for (var C = f.className.split(/\s+/), S = 0, D = C.length; S < D; S++) if (C[S] == v) return !0;
        return !1;
      }
      function _(f) {
        return f.o.location.hostname || f.a.location.hostname;
      }
      function P(f, v, C) {
        function S() {
          ke && D && X && (ke(se), ke = null);
        }
        v = a(f, "link", { rel: "stylesheet", href: v, media: "all" });
        var D = !1, X = !0, se = null, ke = C || null;
        o ? (v.onload = function() {
          D = !0, S();
        }, v.onerror = function() {
          D = !0, se = Error("Stylesheet failed to load"), S();
        }) : setTimeout(function() {
          D = !0, S();
        }, 0), l(f, "head", v);
      }
      function M(f, v, C, S) {
        var D = f.c.getElementsByTagName("head")[0];
        if (D) {
          var X = a(f, "script", { src: v }), se = !1;
          return X.onload = X.onreadystatechange = function() {
            se || this.readyState && this.readyState != "loaded" && this.readyState != "complete" || (se = !0, C && C(null), X.onload = X.onreadystatechange = null, X.parentNode.tagName == "HEAD" && D.removeChild(X));
          }, D.appendChild(X), setTimeout(function() {
            se || (se = !0, C && C(Error("Script load timeout")));
          }, S || 5e3), X;
        }
        return null;
      }
      function K() {
        this.a = 0, this.c = null;
      }
      function Me(f) {
        return f.a++, function() {
          f.a--, _e(f);
        };
      }
      function fe(f, v) {
        f.c = v, _e(f);
      }
      function _e(f) {
        f.a == 0 && f.c && (f.c(), f.c = null);
      }
      function be(f) {
        this.a = f || "-";
      }
      be.prototype.c = function(f) {
        for (var v = [], C = 0; C < arguments.length; C++) v.push(arguments[C].replace(/[\W_]+/g, "").toLowerCase());
        return v.join(this.a);
      };
      function k(f, v) {
        this.c = f, this.f = 4, this.a = "n";
        var C = (v || "n4").match(/^([nio])([1-9])$/i);
        C && (this.a = C[1], this.f = parseInt(C[2], 10));
      }
      function N(f) {
        return Ae(f) + " " + (f.f + "00") + " 300px " + j(f.c);
      }
      function j(f) {
        var v = [];
        f = f.split(/,\s*/);
        for (var C = 0; C < f.length; C++) {
          var S = f[C].replace(/['"]/g, "");
          S.indexOf(" ") != -1 || /^\d/.test(S) ? v.push("'" + S + "'") : v.push(S);
        }
        return v.join(",");
      }
      function V(f) {
        return f.a + f.f;
      }
      function Ae(f) {
        var v = "normal";
        return f.a === "o" ? v = "oblique" : f.a === "i" && (v = "italic"), v;
      }
      function Ne(f) {
        var v = 4, C = "n", S = null;
        return f && ((S = f.match(/(normal|oblique|italic)/i)) && S[1] && (C = S[1].substr(0, 1).toLowerCase()), (S = f.match(/([1-9]00|normal|bold)/i)) && S[1] && (/bold/i.test(S[1]) ? v = 7 : /[1-9]00/.test(S[1]) && (v = parseInt(S[1].substr(0, 1), 10)))), C + v;
      }
      function tt(f, v) {
        this.c = f, this.f = f.o.document.documentElement, this.h = v, this.a = new be("-"), this.j = v.events !== !1, this.g = v.classes !== !1;
      }
      function Ce(f) {
        f.g && c(f.f, [f.a.c("wf", "loading")]), Ge(f, "loading");
      }
      function ve(f) {
        if (f.g) {
          var v = w(f.f, f.a.c("wf", "active")), C = [], S = [f.a.c("wf", "loading")];
          v || C.push(f.a.c("wf", "inactive")), c(f.f, C, S);
        }
        Ge(f, "inactive");
      }
      function Ge(f, v, C) {
        f.j && f.h[v] && (C ? f.h[v](C.c, V(C)) : f.h[v]());
      }
      function nt() {
        this.c = {};
      }
      function lt(f, v, C) {
        var S = [], D;
        for (D in v) if (v.hasOwnProperty(D)) {
          var X = f.c[D];
          X && S.push(X(v[D], C));
        }
        return S;
      }
      function le(f, v) {
        this.c = f, this.f = v, this.a = a(this.c, "span", { "aria-hidden": "true" }, this.f);
      }
      function ge(f) {
        l(f.c, "body", f.a);
      }
      function ee(f) {
        return "display:block;position:absolute;top:-9999px;left:-9999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:" + j(f.c) + ";" + ("font-style:" + Ae(f) + ";font-weight:" + (f.f + "00") + ";");
      }
      function ot(f, v, C, S, D, X) {
        this.g = f, this.j = v, this.a = S, this.c = C, this.f = D || 3e3, this.h = X || void 0;
      }
      ot.prototype.start = function() {
        var f = this.c.o.document, v = this, C = i(), S = new Promise(function(se, ke) {
          function Se() {
            i() - C >= v.f ? ke() : f.fonts.load(N(v.a), v.h).then(function(Ze) {
              1 <= Ze.length ? se() : setTimeout(Se, 25);
            }, function() {
              ke();
            });
          }
          Se();
        }), D = null, X = new Promise(function(se, ke) {
          D = setTimeout(ke, v.f);
        });
        Promise.race([X, S]).then(function() {
          D && (clearTimeout(D), D = null), v.g(v.a);
        }, function() {
          v.j(v.a);
        });
      };
      function Re(f, v, C, S, D, X, se) {
        this.v = f, this.B = v, this.c = C, this.a = S, this.s = se || "BESbswy", this.f = {}, this.w = D || 3e3, this.u = X || null, this.m = this.j = this.h = this.g = null, this.g = new le(this.c, this.s), this.h = new le(this.c, this.s), this.j = new le(this.c, this.s), this.m = new le(this.c, this.s), f = new k(this.a.c + ",serif", V(this.a)), f = ee(f), this.g.a.style.cssText = f, f = new k(this.a.c + ",sans-serif", V(this.a)), f = ee(f), this.h.a.style.cssText = f, f = new k("serif", V(this.a)), f = ee(f), this.j.a.style.cssText = f, f = new k("sans-serif", V(this.a)), f = ee(f), this.m.a.style.cssText = f, ge(this.g), ge(this.h), ge(this.j), ge(this.m);
      }
      var de = { D: "serif", C: "sans-serif" }, Ye = null;
      function Oe() {
        if (Ye === null) {
          var f = /AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent);
          Ye = !!f && (536 > parseInt(f[1], 10) || parseInt(f[1], 10) === 536 && 11 >= parseInt(f[2], 10));
        }
        return Ye;
      }
      Re.prototype.start = function() {
        this.f.serif = this.j.a.offsetWidth, this.f["sans-serif"] = this.m.a.offsetWidth, this.A = i(), me(this);
      };
      function q(f, v, C) {
        for (var S in de) if (de.hasOwnProperty(S) && v === f.f[de[S]] && C === f.f[de[S]]) return !0;
        return !1;
      }
      function me(f) {
        var v = f.g.a.offsetWidth, C = f.h.a.offsetWidth, S;
        (S = v === f.f.serif && C === f.f["sans-serif"]) || (S = Oe() && q(f, v, C)), S ? i() - f.A >= f.w ? Oe() && q(f, v, C) && (f.u === null || f.u.hasOwnProperty(f.a.c)) ? Fe(f, f.v) : Fe(f, f.B) : ae(f) : Fe(f, f.v);
      }
      function ae(f) {
        setTimeout(s(function() {
          me(this);
        }, f), 50);
      }
      function Fe(f, v) {
        setTimeout(s(function() {
          h(this.g.a), h(this.h.a), h(this.j.a), h(this.m.a), v(this.a);
        }, f), 0);
      }
      function G(f, v, C) {
        this.c = f, this.a = v, this.f = 0, this.m = this.j = !1, this.s = C;
      }
      var Xe = null;
      G.prototype.g = function(f) {
        var v = this.a;
        v.g && c(v.f, [v.a.c("wf", f.c, V(f).toString(), "active")], [v.a.c("wf", f.c, V(f).toString(), "loading"), v.a.c("wf", f.c, V(f).toString(), "inactive")]), Ge(v, "fontactive", f), this.m = !0, ct(this);
      }, G.prototype.h = function(f) {
        var v = this.a;
        if (v.g) {
          var C = w(v.f, v.a.c("wf", f.c, V(f).toString(), "active")), S = [], D = [v.a.c("wf", f.c, V(f).toString(), "loading")];
          C || S.push(v.a.c("wf", f.c, V(f).toString(), "inactive")), c(v.f, S, D);
        }
        Ge(v, "fontinactive", f), ct(this);
      };
      function ct(f) {
        --f.f == 0 && f.j && (f.m ? (f = f.a, f.g && c(f.f, [f.a.c("wf", "active")], [f.a.c("wf", "loading"), f.a.c("wf", "inactive")]), Ge(f, "active")) : ve(f.a));
      }
      function At(f) {
        this.j = f, this.a = new nt(), this.h = 0, this.f = this.g = !0;
      }
      At.prototype.load = function(f) {
        this.c = new r(this.j, f.context || this.j), this.g = f.events !== !1, this.f = f.classes !== !1, y(this, new tt(this.c, f), f);
      };
      function g(f, v, C, S, D) {
        var X = --f.h == 0;
        (f.f || f.g) && setTimeout(function() {
          var se = D || null, ke = S || null || {};
          if (C.length === 0 && X) ve(v.a);
          else {
            v.f += C.length, X && (v.j = X);
            var Se, Ze = [];
            for (Se = 0; Se < C.length; Se++) {
              var De = C[Se], gt = ke[De.c], _t = v.a, ze = De;
              if (_t.g && c(_t.f, [_t.a.c("wf", ze.c, V(ze).toString(), "loading")]), Ge(_t, "fontloading", ze), _t = null, Xe === null) if (window.FontFace) {
                var ze = /Gecko.*Firefox\/(\d+)/.exec(window.navigator.userAgent), Yt = /OS X.*Version\/10\..*Safari/.exec(window.navigator.userAgent) && /Apple/.exec(window.navigator.vendor);
                Xe = ze ? 42 < parseInt(ze[1], 10) : !Yt;
              } else Xe = !1;
              Xe ? _t = new ot(s(v.g, v), s(v.h, v), v.c, De, v.s, gt) : _t = new Re(s(v.g, v), s(v.h, v), v.c, De, v.s, se, gt), Ze.push(_t);
            }
            for (Se = 0; Se < Ze.length; Se++) Ze[Se].start();
          }
        }, 0);
      }
      function y(f, v, C) {
        var D = [], S = C.timeout;
        Ce(v);
        var D = lt(f.a, C, f.c), X = new G(f.c, v, S);
        for (f.h = D.length, v = 0, C = D.length; v < C; v++) D[v].load(function(se, ke, Se) {
          g(f, X, se, ke, Se);
        });
      }
      function A(f, v) {
        this.c = f, this.a = v;
      }
      A.prototype.load = function(f) {
        function v() {
          if (X["__mti_fntLst" + S]) {
            var se = X["__mti_fntLst" + S](), ke = [], Se;
            if (se) for (var Ze = 0; Ze < se.length; Ze++) {
              var De = se[Ze].fontfamily;
              se[Ze].fontStyle != null && se[Ze].fontWeight != null ? (Se = se[Ze].fontStyle + se[Ze].fontWeight, ke.push(new k(De, Se))) : ke.push(new k(De));
            }
            f(ke);
          } else setTimeout(function() {
            v();
          }, 50);
        }
        var C = this, S = C.a.projectId, D = C.a.version;
        if (S) {
          var X = C.c.o;
          M(this.c, (C.a.api || "https://fast.fonts.net/jsapi") + "/" + S + ".js" + (D ? "?v=" + D : ""), function(se) {
            se ? f([]) : (X["__MonotypeConfiguration__" + S] = function() {
              return C.a;
            }, v());
          }).id = "__MonotypeAPIScript__" + S;
        } else f([]);
      };
      function I(f, v) {
        this.c = f, this.a = v;
      }
      I.prototype.load = function(f) {
        var v, C, S = this.a.urls || [], D = this.a.families || [], X = this.a.testStrings || {}, se = new K();
        for (v = 0, C = S.length; v < C; v++) P(this.c, S[v], Me(se));
        var ke = [];
        for (v = 0, C = D.length; v < C; v++) if (S = D[v].split(":"), S[1]) for (var Se = S[1].split(","), Ze = 0; Ze < Se.length; Ze += 1) ke.push(new k(S[0], Se[Ze]));
        else ke.push(new k(S[0]));
        fe(se, function() {
          f(ke, X);
        });
      };
      function L(f, v) {
        f ? this.c = f : this.c = R, this.a = [], this.f = [], this.g = v || "";
      }
      var R = "https://fonts.googleapis.com/css";
      function z(f, v) {
        for (var C = v.length, S = 0; S < C; S++) {
          var D = v[S].split(":");
          D.length == 3 && f.f.push(D.pop());
          var X = "";
          D.length == 2 && D[1] != "" && (X = ":"), f.a.push(D.join(X));
        }
      }
      function $(f) {
        if (f.a.length == 0) throw Error("No fonts to load!");
        if (f.c.indexOf("kit=") != -1) return f.c;
        for (var v = f.a.length, C = [], S = 0; S < v; S++) C.push(f.a[S].replace(/ /g, "+"));
        return v = f.c + "?family=" + C.join("%7C"), 0 < f.f.length && (v += "&subset=" + f.f.join(",")), 0 < f.g.length && (v += "&text=" + encodeURIComponent(f.g)), v;
      }
      function U(f) {
        this.f = f, this.a = [], this.c = {};
      }
      var F = { latin: "BESbswy", "latin-ext": "çöüğş", cyrillic: "йяЖ", greek: "αβΣ", khmer: "កខគ", Hanuman: "កខគ" }, J = { thin: "1", extralight: "2", "extra-light": "2", ultralight: "2", "ultra-light": "2", light: "3", regular: "4", book: "4", medium: "5", "semi-bold": "6", semibold: "6", "demi-bold": "6", demibold: "6", bold: "7", "extra-bold": "8", extrabold: "8", "ultra-bold": "8", ultrabold: "8", black: "9", heavy: "9", l: "3", r: "4", b: "7" }, H = { i: "i", italic: "i", n: "n", normal: "n" }, Y = /^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/;
      function Q(f) {
        for (var v = f.f.length, C = 0; C < v; C++) {
          var S = f.f[C].split(":"), D = S[0].replace(/\+/g, " "), X = ["n4"];
          if (2 <= S.length) {
            var se, ke = S[1];
            if (se = [], ke) for (var ke = ke.split(","), Se = ke.length, Ze = 0; Ze < Se; Ze++) {
              var De;
              if (De = ke[Ze], De.match(/^[\w-]+$/)) {
                var gt = Y.exec(De.toLowerCase());
                if (gt == null) De = "";
                else {
                  if (De = gt[2], De = De == null || De == "" ? "n" : H[De], gt = gt[1], gt == null || gt == "") gt = "4";
                  else var _t = J[gt], gt = _t || (isNaN(gt) ? "4" : gt.substr(0, 1));
                  De = [De, gt].join("");
                }
              } else De = "";
              De && se.push(De);
            }
            0 < se.length && (X = se), S.length == 3 && (S = S[2], se = [], S = S ? S.split(",") : se, 0 < S.length && (S = F[S[0]]) && (f.c[D] = S));
          }
          for (f.c[D] || (S = F[D]) && (f.c[D] = S), S = 0; S < X.length; S += 1) f.a.push(new k(D, X[S]));
        }
      }
      function ie(f, v) {
        this.c = f, this.a = v;
      }
      var Pe = { Arimo: !0, Cousine: !0, Tinos: !0 };
      ie.prototype.load = function(f) {
        var v = new K(), C = this.c, S = new L(this.a.api, this.a.text), D = this.a.families;
        z(S, D);
        var X = new U(D);
        Q(X), P(C, $(S), Me(v)), fe(v, function() {
          f(X.a, X.c, Pe);
        });
      };
      function ce(f, v) {
        this.c = f, this.a = v;
      }
      ce.prototype.load = function(f) {
        var v = this.a.id, C = this.c.o;
        v ? M(this.c, (this.a.api || "https://use.typekit.net") + "/" + v + ".js", function(S) {
          if (S) f([]);
          else if (C.Typekit && C.Typekit.config && C.Typekit.config.fn) {
            S = C.Typekit.config.fn;
            for (var D = [], X = 0; X < S.length; X += 2) for (var se = S[X], ke = S[X + 1], Se = 0; Se < ke.length; Se++) D.push(new k(se, ke[Se]));
            try {
              C.Typekit.load({ events: !1, classes: !1, async: !0 });
            } catch {
            }
            f(D);
          }
        }, 2e3) : f([]);
      };
      function ut(f, v) {
        this.c = f, this.f = v, this.a = [];
      }
      ut.prototype.load = function(f) {
        var v = this.f.id, C = this.c.o, S = this;
        v ? (C.__webfontfontdeckmodule__ || (C.__webfontfontdeckmodule__ = {}), C.__webfontfontdeckmodule__[v] = function(D, X) {
          for (var se = 0, ke = X.fonts.length; se < ke; ++se) {
            var Se = X.fonts[se];
            S.a.push(new k(Se.name, Ne("font-weight:" + Se.weight + ";font-style:" + Se.style)));
          }
          f(S.a);
        }, M(this.c, (this.f.api || "https://f.fontdeck.com/s/css/js/") + _(this.c) + "/" + v + ".js", function(D) {
          D && f([]);
        })) : f([]);
      };
      var Ue = new At(window);
      Ue.a.c.custom = function(f, v) {
        return new I(v, f);
      }, Ue.a.c.fontdeck = function(f, v) {
        return new ut(v, f);
      }, Ue.a.c.monotype = function(f, v) {
        return new A(v, f);
      }, Ue.a.c.typekit = function(f, v) {
        return new ce(v, f);
      }, Ue.a.c.google = function(f, v) {
        return new ie(v, f);
      };
      var st = { load: s(Ue.load, Ue) };
      e.exports ? e.exports = st : (window.WebFont = st, window.WebFontConfig && Ue.load(window.WebFontConfig));
    })();
  }(Er)), Er.exports;
}
var ug = cg();
const fg = /* @__PURE__ */ lg(ug), Ja = [
  "Space Grotesk:400,500,600,700",
  "Instrument Sans:400,500,600",
  "JetBrains Mono:400,500,600"
], hg = (e) => {
  const t = [...Ja], n = (e == null ? void 0 : e.split(",")[0].trim().replace(/['"]/g, "")) || "", s = Ja.some(
    (i) => i.toLowerCase().startsWith(n.toLowerCase())
  );
  n && !s && t.push(n), fg.load({
    google: { families: t },
    active: () => {
      if (!e) return;
      const i = document.querySelector(".chat-container");
      i && (i.style.fontFamily = e.includes(",") ? e : `"${e}", system-ui, sans-serif`);
    }
  });
};
function dg() {
  const e = oe({}), t = oe(""), n = (i) => {
    var r;
    e.value = i, i.photo_url && (e.value.photo_url = i.photo_url), hg(i.font_family), window.parent.postMessage({
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
const pg = 13, gg = 24;
function mg(e, t) {
  const n = Hi({}), s = [];
  let i = null;
  const r = typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, o = (c) => {
    i || s.length === 0 || (i = setTimeout(a, c));
  }, a = () => {
    i = null;
    const c = s[0];
    if (c === void 0) return;
    const w = e.value[c], _ = n[c], P = (w == null ? void 0 : w.message) ?? "";
    if (!_ || !w) {
      s.shift(), o(0);
      return;
    }
    if (_.shown >= P.length) {
      _.done = !0, s.shift(), o(0);
      return;
    }
    _.shown += 1;
    const M = P[_.shown - 1];
    t == null || t(), o(M === " " ? gg : pg);
  };
  jt(() => e.value.length, (c, w) => {
    w !== void 0 && c < w && (Object.keys(n).forEach((_) => {
      delete n[Number(_)];
    }), s.length = 0);
    for (let _ = w ?? 0; _ < c; _++) {
      const P = e.value[_];
      if (!P || !P.stream || _ in n) continue;
      const M = P.message ?? "";
      r || !M ? n[_] = { shown: M.length, done: !0 } : (n[_] = { shown: 0, done: !1 }, s.push(_));
    }
    o(0);
  });
  const l = (c, w) => {
    const _ = n[c];
    return _ ? w.slice(0, _.shown) : w;
  }, h = (c) => {
    const w = n[c];
    return !!w && !w.done;
  };
  return Ks(() => {
    i && clearTimeout(i);
  }), { displayText: l, isStreaming: h };
}
function _g(e) {
  const t = oe(!0);
  let n = 0;
  const s = () => {
    window.parent.postMessage({ type: "UNREAD_COUNT", count: n }, "*");
  }, i = (r) => {
    var o;
    ((o = r == null ? void 0 : r.data) == null ? void 0 : o.type) === "WIDGET_VISIBILITY" && (t.value = !!r.data.open, t.value && n !== 0 && (n = 0, s()));
  };
  jt(() => e.value.length, (r, o) => {
    if (r <= (o ?? 0) || t.value) return;
    const a = e.value[r - 1];
    a && (a.message_type === "bot" || a.message_type === "agent") && (n += 1, s());
  }), ji(() => window.addEventListener("message", i)), Ks(() => window.removeEventListener("message", i));
}
const yg = {
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
}, vg = {
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
}, bg = {
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
}, wg = {
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
}, kg = {
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
}, Ti = {
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
}, xg = {
  GLASS: yg,
  AURORA: vg,
  TERMINAL: bg,
  CALM_MINT: wg,
  PLAYFUL: kg,
  SUNRISE: Ti,
  CHATBOT: Ti,
  ASK_ANYTHING: Ti
}, Ag = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", Qa = "'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
function Tg(e) {
  return Math.max(4, Math.round(e * 0.3));
}
function el(e) {
  const t = (e || "").replace("#", "");
  if (t.length < 6) return "#0B0C10";
  const n = parseInt(t.slice(0, 2), 16), s = parseInt(t.slice(2, 4), 16), i = parseInt(t.slice(4, 6), 16);
  return (0.299 * n + 0.587 * s + 0.114 * i) / 255 > 0.62 ? "#0B0C10" : "#FFFFFF";
}
function Sg(e) {
  return xg[e || ""] || Ti;
}
const Eg = "#212529";
function Cg(e, t) {
  const n = Sg(e), s = (t == null ? void 0 : t.chat_background_color) || "", i = /^#[0-9a-fA-F]{6}$/.test(s), r = s || n.card, o = (t == null ? void 0 : t.chat_text_color) || "", l = /^#[0-9a-fA-F]{6}$/.test(o) && o.toLowerCase() !== Eg ? o : i ? ls(s) ? "#FFFFFF" : "#111111" : n.text, h = i ? ls(s) ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)" : n.muted, c = i ? Mh(s, 20) : n.agentBg, w = (t == null ? void 0 : t.accent_color) || n.accent, _ = i ? !ls(s) : n.light, P = el(w) === "#0B0C10", M = _ === P ? h : w, K = n.mono ? Ag : t != null && t.font_family ? `${t.font_family}, ${Qa}` : Qa;
  return {
    "--cm-card": r,
    "--cm-text": l,
    "--cm-muted": h,
    "--cm-agent-bg": c,
    "--cm-accent": w,
    "--cm-on-accent": el(w),
    "--cm-presence": M,
    "--cm-border": n.border,
    "--cm-glow": n.glow,
    "--cm-radius": `${n.radius}px`,
    "--cm-bubble": `${n.bubble}px`,
    "--cm-bubble-tail": `${Tg(n.bubble)}px`,
    "--cm-field-radius": n.mono ? "7px" : "12px",
    "--cm-avatar-radius": n.mono ? "28%" : "50%",
    "--cm-hairline": n.light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)",
    "--cm-body-font": K
  };
}
function Rg() {
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
const Ig = {
  key: 0,
  class: "widget-unavailable-overlay"
}, Lg = {
  key: 1,
  class: "auth-error-overlay"
}, Og = { class: "auth-error-card" }, Pg = { class: "auth-error-message" }, Mg = {
  key: 0,
  class: "initializing-overlay"
}, Ng = {
  key: 0,
  class: "connecting-message"
}, Fg = {
  key: 1,
  class: "failed-message"
}, Dg = { class: "welcome-content" }, Bg = { class: "welcome-header" }, $g = ["src", "alt"], Ug = { class: "welcome-title" }, zg = { class: "welcome-subtitle" }, Hg = { class: "welcome-input-container" }, qg = {
  key: 0,
  class: "email-input"
}, Wg = ["disabled"], jg = { class: "welcome-message-input" }, Vg = ["placeholder", "disabled"], Kg = ["disabled"], Gg = {
  key: 0,
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, Yg = {
  key: 1,
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, Xg = { class: "landing-page-content" }, Zg = { class: "landing-page-header" }, Jg = { class: "landing-page-heading" }, Qg = { class: "landing-page-text" }, em = { class: "landing-page-actions" }, tm = { class: "form-fullscreen-content" }, nm = {
  key: 0,
  class: "form-header"
}, sm = {
  key: 0,
  class: "form-title"
}, im = {
  key: 1,
  class: "form-description"
}, rm = { class: "form-fields" }, om = ["for"], am = {
  key: 0,
  class: "required-indicator"
}, lm = ["id", "type", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "onBlur", "autocomplete", "inputmode"], cm = ["id", "placeholder", "required", "min", "max", "value", "onInput"], um = ["id", "placeholder", "required", "minlength", "maxlength", "value", "onInput"], fm = ["id", "required", "value", "onChange"], hm = { value: "" }, dm = ["value"], pm = {
  key: 4,
  class: "checkbox-field"
}, gm = ["id", "required", "checked", "onChange"], mm = { class: "checkbox-label" }, _m = {
  key: 5,
  class: "radio-group"
}, ym = ["name", "value", "required", "checked", "onChange"], vm = { class: "radio-label" }, bm = {
  key: 6,
  class: "field-error"
}, wm = { class: "form-actions" }, km = ["disabled"], xm = {
  key: 0,
  class: "loading-spinner-inline"
}, Am = { key: 1 }, Tm = { class: "header-content" }, Sm = ["src", "alt"], Em = { class: "header-info" }, Cm = { class: "ask-anything-header" }, Rm = ["src", "alt"], Im = { class: "header-info" }, Lm = {
  key: 2,
  class: "loading-history"
}, Om = { class: "cm-email-gate-title" }, Pm = ["disabled"], Mm = {
  key: 0,
  class: "cm-email-gate-error"
}, Nm = ["disabled"], Fm = {
  key: 0,
  class: "cm-welcome-block"
}, Dm = { class: "message agent-message cm-welcome-row" }, Bm = ["src", "alt"], $m = {
  key: 0,
  class: "cm-msg-avatar",
  "aria-hidden": "true"
}, Um = ["src"], zm = ["src"], Hm = { class: "message-col" }, qm = {
  key: 0,
  class: "rating-content"
}, Wm = { class: "rating-prompt" }, jm = ["onMouseover", "onMouseleave", "onClick", "disabled"], Vm = {
  key: 0,
  class: "feedback-wrapper"
}, Km = { class: "feedback-section" }, Gm = ["onUpdate:modelValue", "disabled"], Ym = { class: "feedback-counter" }, Xm = ["onClick", "disabled"], Zm = {
  key: 1,
  class: "submitted-feedback-wrapper"
}, Jm = { class: "submitted-feedback" }, Qm = { class: "submitted-feedback-text" }, e_ = {
  key: 2,
  class: "submitted-message"
}, t_ = {
  key: 1,
  class: "form-content"
}, n_ = {
  key: 0,
  class: "form-header"
}, s_ = {
  key: 0,
  class: "form-title"
}, i_ = {
  key: 1,
  class: "form-description"
}, r_ = { class: "form-fields" }, o_ = ["for"], a_ = {
  key: 0,
  class: "required-indicator"
}, l_ = ["id", "type", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "onBlur", "disabled", "autocomplete", "inputmode"], c_ = ["id", "placeholder", "required", "min", "max", "value", "onInput", "disabled"], u_ = ["id", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "disabled"], f_ = ["id", "required", "value", "onChange", "disabled"], h_ = { value: "" }, d_ = ["value"], p_ = {
  key: 4,
  class: "checkbox-field"
}, g_ = ["id", "checked", "onChange", "disabled"], m_ = ["for"], __ = {
  key: 5,
  class: "radio-field"
}, y_ = ["id", "name", "value", "checked", "onChange", "disabled"], v_ = ["for"], b_ = {
  key: 6,
  class: "field-error"
}, w_ = { class: "form-actions" }, k_ = ["onClick", "disabled"], x_ = {
  key: 2,
  class: "user-input-content"
}, A_ = {
  key: 0,
  class: "user-input-prompt"
}, T_ = {
  key: 1,
  class: "user-input-form"
}, S_ = ["onUpdate:modelValue", "onKeydown"], E_ = ["onClick", "disabled"], C_ = {
  key: 2,
  class: "user-input-submitted"
}, R_ = {
  key: 0,
  class: "user-input-confirmation"
}, I_ = {
  key: 3,
  class: "product-message-container"
}, L_ = ["innerHTML"], O_ = {
  key: 1,
  class: "products-carousel"
}, P_ = { class: "carousel-items" }, M_ = {
  key: 0,
  class: "product-image-compact"
}, N_ = ["src", "alt"], F_ = { class: "product-info-compact" }, D_ = { class: "product-text-area" }, B_ = { class: "product-title-compact" }, $_ = {
  key: 0,
  class: "product-variant-compact"
}, U_ = { class: "product-price-compact" }, z_ = { class: "product-actions-compact" }, H_ = ["onClick"], q_ = {
  key: 2,
  class: "no-products-message"
}, W_ = {
  key: 3,
  class: "no-products-message"
}, j_ = ["innerHTML"], V_ = ["innerHTML"], K_ = {
  key: 2,
  class: "message-attachments"
}, G_ = {
  key: 0,
  class: "attachment-image-container"
}, Y_ = ["src", "alt", "onClick"], X_ = { class: "attachment-image-info" }, Z_ = ["href"], J_ = { class: "attachment-size" }, Q_ = ["href"], ey = { class: "attachment-size" }, ty = {
  key: 0,
  class: "citation-chips"
}, ny = ["title"], sy = { class: "message-info" }, iy = {
  key: 0,
  class: "agent-name"
}, ry = {
  key: 4,
  class: "cm-quick-actions-bar"
}, oy = ["disabled", "onClick"], ay = {
  key: 0,
  class: "file-previews-widget"
}, ly = {
  class: "file-preview-content-widget",
  style: { cursor: "pointer" }
}, cy = ["src", "alt", "onClick"], uy = ["onClick"], fy = { class: "file-preview-info-widget" }, hy = { class: "file-preview-name-widget" }, dy = { class: "file-preview-size-widget" }, py = ["onClick"], gy = {
  key: 1,
  class: "upload-progress-widget"
}, my = { class: "message-input" }, _y = ["placeholder", "disabled"], yy = ["disabled", "title"], vy = ["disabled"], by = {
  key: 6,
  class: "new-conversation-section"
}, wy = { class: "conversation-ended-message" }, ky = {
  key: 8,
  class: "rating-dialog"
}, xy = { class: "rating-content" }, Ay = { class: "star-rating" }, Ty = ["onClick"], Sy = { class: "rating-actions" }, Ey = ["disabled"], Cy = {
  key: 0,
  class: "preview-modal-image-container"
}, Ry = ["src", "alt"], Iy = { class: "preview-modal-filename" }, Ly = {
  key: 3,
  class: "widget-loading"
}, Cs = "ctid", tl = 3, Oy = "image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls", Py = /* @__PURE__ */ Ll({
  __name: "WidgetBuilder",
  props: {
    widgetId: {},
    token: {},
    initialAuthError: {}
  },
  setup(e) {
    var Ho;
    const t = e, n = ue(() => {
      var d;
      return t.widgetId || ((d = window.__INITIAL_DATA__) == null ? void 0 : d.widgetId);
    }), {
      customization: s,
      agentName: i,
      applyCustomization: r,
      initializeFromData: o
    } = dg(), { formatCurrency: a } = Rg(), {
      messages: l,
      loading: h,
      errorMessage: c,
      showError: w,
      loadingHistory: _,
      hasStartedChat: P,
      connectionStatus: M,
      sendMessage: K,
      loadChatHistory: Me,
      connect: fe,
      reconnect: _e,
      cleanup: be,
      humanAgent: k,
      onTakeover: N,
      submitRating: j,
      submitForm: V,
      currentForm: Ae,
      getWorkflowState: Ne,
      proceedWorkflow: tt,
      onWorkflowState: Ce,
      onWorkflowProceeded: ve,
      currentSessionId: Ge,
      setToken: nt,
      setWidgetId: lt
    } = ag(), { displayText: le, isStreaming: ge } = mg(l, () => os(() => Nn()));
    _g(l);
    const ee = oe(""), ot = oe(!0), Re = oe(""), de = oe(!1), Ye = (d) => {
      const p = d.target;
      ee.value = p.value;
    };
    let Oe = null;
    const q = () => {
      Oe && Oe.disconnect(), Oe = new MutationObserver((p) => {
        let u = !1, te = !1;
        p.forEach((we) => {
          if (we.type === "childList") {
            const he = Array.from(we.addedNodes).some(
              (xe) => {
                var Xt;
                return xe.nodeType === Node.ELEMENT_NODE && (xe.matches("input, textarea") || ((Xt = xe.querySelector) == null ? void 0 : Xt.call(xe, "input, textarea")));
              }
            ), Ve = Array.from(we.removedNodes).some(
              (xe) => {
                var Xt;
                return xe.nodeType === Node.ELEMENT_NODE && (xe.matches("input, textarea") || ((Xt = xe.querySelector) == null ? void 0 : Xt.call(xe, "input, textarea")));
              }
            );
            he && (te = !0, u = !0), Ve && (u = !0);
          }
        }), u && (clearTimeout(q.timeoutId), q.timeoutId = setTimeout(() => {
          ae();
        }, te ? 50 : 100));
      });
      const d = document.querySelector(".widget-container") || document.body;
      Oe.observe(d, {
        childList: !0,
        subtree: !0
      });
    };
    q.timeoutId = null;
    let me = [];
    const ae = () => {
      Fe();
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
      let p = [];
      for (const u of d) {
        const te = document.querySelectorAll(u);
        if (te.length > 0) {
          p = Array.from(te);
          break;
        }
      }
      p.length !== 0 && (me = p, p.forEach((u) => {
        u.addEventListener("input", Xe, !0), u.addEventListener("keyup", Xe, !0), u.addEventListener("change", Xe, !0), u.addEventListener("keypress", ct, !0), u.addEventListener("keydown", At, !0);
      }));
    }, Fe = () => {
      me.forEach((d) => {
        d.removeEventListener("input", Xe), d.removeEventListener("keyup", Xe), d.removeEventListener("change", Xe), d.removeEventListener("keypress", ct), d.removeEventListener("keydown", At);
      }), me = [];
    }, G = (d) => !!(d && d.closest && d.closest(".form-message, .form-fullscreen, .cm-email-gate")), Xe = (d) => {
      if (G(d.target)) return;
      const p = d.target;
      ee.value = p.value;
    }, ct = (d) => {
      G(d.target) || d.key === "Enter" && !d.shiftKey && (d.preventDefault(), d.stopPropagation(), tn());
    }, At = (d) => {
      G(d.target) || d.key === "Enter" && !d.shiftKey && (d.preventDefault(), d.stopPropagation(), tn());
    }, g = (d) => {
      const p = d.target, u = document.querySelector(".header-menu-container");
      document.querySelector(".header-menu-btn");
      const te = document.querySelector(".header-dropdown-menu");
      te && !(u != null && u.contains(p)) && (te.style.display = "none");
    }, y = oe(!0), A = (d) => !d || d === "undefined" || d === "null" || typeof d == "string" && d.trim() === "" ? null : d, I = oe(A(((Ho = window.__INITIAL_DATA__) == null ? void 0 : Ho.initialToken) || localStorage.getItem(Cs)));
    ue(() => !!I.value);
    const L = oe(null), R = oe(!1), z = oe(!1);
    t.initialAuthError && (L.value = t.initialAuthError, R.value = !0, y.value = !1), o();
    const $ = window.__INITIAL_DATA__;
    if ($ != null && $.initialToken) {
      const d = A($.initialToken);
      d && (I.value = d, window.parent.postMessage({
        type: "TOKEN_UPDATE",
        token: d
      }, "*"), de.value = !0);
    }
    const U = oe(!1);
    ($ == null ? void 0 : $.allowAttachments) !== void 0 && (U.value = $.allowAttachments);
    const F = oe(null), {
      chatStyles: J,
      chatIconStyles: H,
      agentBubbleStyles: Y,
      userBubbleStyles: Q,
      messageNameStyles: ie,
      headerBorderStyles: Pe,
      photoUrl: ce,
      shadowStyle: ut
    } = fp(s), Ue = oe(null), {
      uploadedAttachments: st,
      previewModal: f,
      previewFile: v,
      formatFileSize: C,
      isImageAttachment: S,
      getDownloadUrl: D,
      getPreviewUrl: X,
      handleFileSelect: se,
      handleDrop: ke,
      handleDragOver: Se,
      handleDragLeave: Ze,
      handlePaste: De,
      removeAttachment: gt,
      openPreview: _t,
      closePreview: ze,
      openFilePicker: Yt,
      isImage: Xs
    } = pp(I, Ue);
    ue(() => l.value.some(
      (d) => d.message_type === "form" && (!d.isSubmitted || d.isSubmitted === !1)
    ));
    const $t = ue(() => {
      var d;
      return P.value && de.value || !ir.value ? M.value === "connected" && !h.value : vs(Re.value.trim()) && M.value === "connected" && !h.value || ((d = window.__INITIAL_DATA__) == null ? void 0 : d.workflow);
    }), Mn = ue(() => M.value === "connected" ? Ht.value ? "Ask me anything..." : "Type a message..." : "Connecting..."), tn = async () => {
      if (!ee.value.trim() && st.value.length === 0) return;
      !P.value && Re.value && await Ut();
      const d = st.value.map((u) => ({
        content: u.content,
        // base64 content
        filename: u.filename,
        content_type: u.type,
        size: u.size
      }));
      await K(ee.value, Re.value, d), st.value.forEach((u) => {
        u.url && u.url.startsWith("blob:") && URL.revokeObjectURL(u.url), u.file_url && u.file_url.startsWith("blob:") && URL.revokeObjectURL(u.file_url);
      }), ee.value = "", st.value = [];
      const p = document.querySelector('input[placeholder*="Type a message"]');
      p && (p.value = ""), setTimeout(() => {
        ae();
      }, 500);
    }, fs = (d) => {
      $t.value && (ee.value = d, tn());
    }, Kn = () => {
      window.parent.postMessage({ type: "WIDGET_MINIMIZE" }, "*");
    }, Mt = (d) => {
      d.key === "Enter" && !d.shiftKey && (d.preventDefault(), d.stopPropagation(), tn());
    }, Ut = async () => {
      var d, p, u, te;
      try {
        if (!n.value)
          return console.error("Widget ID is not available"), L.value = "Widget ID is not available. Please refresh and try again.", R.value = !0, !1;
        const we = new URL(`${js.API_URL}/widgets/${n.value}`);
        Re.value.trim() && vs(Re.value.trim()) && we.searchParams.append("email", Re.value.trim());
        const he = {
          Accept: "application/json",
          "Content-Type": "application/json"
        };
        I.value && (he.Authorization = `Bearer ${I.value}`);
        const Ve = await fetch(we, {
          headers: he
        });
        if (Ve.status === 401) {
          de.value = !1;
          try {
            const Jn = (await Ve.json()).detail || "";
            (Jn.includes("generate-token") || Jn.includes("API key") || Jn.includes("Token required")) && (z.value = !0, L.value = "Widget authentication not configured. Please contact the website administrator.", R.value = !0, localStorage.removeItem(Cs), I.value = null);
          } catch {
            L.value = "Authentication required. Your token has expired or is invalid. Please refresh the page.", R.value = !0, localStorage.removeItem(Cs), I.value = null;
          }
          return !1;
        }
        if (!Ve.ok) {
          try {
            const gs = await Ve.json();
            L.value = gs.detail || `Error: ${Ve.statusText}`;
          } catch {
            L.value = `Error: ${Ve.statusText}. Please try again.`;
          }
          return R.value = !0, !1;
        }
        const xe = await Ve.json();
        return xe.token && (I.value = xe.token, localStorage.setItem(Cs, xe.token), window.parent.postMessage({ type: "TOKEN_UPDATE", token: xe.token }, "*")), de.value = !0, L.value = null, R.value = !1, nt(I.value || void 0), await fe() ? (await Zs(), (d = xe.agent) != null && d.customization && r(xe.agent.customization), xe.agent && !(xe != null && xe.human_agent) && (i.value = xe.agent.name), xe != null && xe.human_agent && (k.value = xe.human_agent), ((p = xe.agent) == null ? void 0 : p.allow_attachments) !== void 0 && (U.value = xe.agent.allow_attachments), ((u = xe.agent) == null ? void 0 : u.workflow) !== void 0 && (window.__INITIAL_DATA__ = window.__INITIAL_DATA__ || {}, window.__INITIAL_DATA__.workflow = xe.agent.workflow), (te = xe.agent) != null && te.workflow && await Ne(), !0) : (console.error("Failed to connect to chat service"), L.value = "Failed to connect to chat service. Please try again.", R.value = !0, !1);
      } catch (we) {
        return console.error("Error checking authorization:", we), L.value = "An unexpected error occurred. Please try again.", R.value = !0, de.value = !1, !1;
      } finally {
        y.value = !1;
      }
    }, Zs = async () => {
      !P.value && de.value && (P.value = !0, await Me());
    }, Nn = () => {
      F.value && (F.value.scrollTop = F.value.scrollHeight);
    };
    jt(() => l.value, (d) => {
      os(() => {
        Nn();
      });
    }, { deep: !0 }), jt(M, (d, p) => {
      d === "connected" && p !== "connected" && setTimeout(ae, 100);
    }), jt(() => l.value.length, (d, p) => {
      d > 0 && p === 0 && setTimeout(ae, 100);
    });
    let Gn = null;
    jt(() => l.value, (d) => {
      const p = d[d.length - 1];
      !qa(p) || p === Gn || (Gn = p, Dn(p));
    }, { deep: !0 });
    const Js = async () => {
      await _e() && await Ut();
    }, zt = oe(!1), Fn = oe(0), Yn = oe(""), Nt = oe(0), Ft = oe(!1), ft = oe({}), W = oe(!1), m = oe({}), B = oe(!1), Z = oe(null), Je = oe("Start Chat"), rt = oe(!1), Ie = oe(null);
    ue(() => {
      var p;
      const d = l.value[l.value.length - 1];
      return ((p = d == null ? void 0 : d.attributes) == null ? void 0 : p.request_rating) || !1;
    });
    const ht = ue(() => {
      var p;
      if (!((p = window.__INITIAL_DATA__) != null && p.workflow))
        return !1;
      const d = l.value.find((u) => u.message_type === "rating");
      return (d == null ? void 0 : d.isSubmitted) === !0;
    }), yt = ue(
      () => Fi(k.value.human_agent_profile_pic)
    ), Dn = async (d) => {
      var p, u, te, we, he;
      if (qa(d)) {
        try {
          if (d.session_id && I.value && n.value) {
            const Ve = new URL(`${js.API_URL}/widgets/${n.value}/end-chat`);
            Ve.searchParams.append("session_id", d.session_id), (p = d.attributes) != null && p.end_chat_reason && Ve.searchParams.append("reason", d.attributes.end_chat_reason), (u = d.attributes) != null && u.end_chat_description && Ve.searchParams.append("description", d.attributes.end_chat_description);
            const xe = await fetch(Ve, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${I.value}`,
                "Content-Type": "application/json"
              }
            });
            if (xe.ok) {
              const Xt = await xe.json();
              console.info(`✓ Chat session closed on backend: ${Xt.session_id}`);
            } else
              console.warn(`Failed to close session on backend: ${xe.status}`);
          }
        } catch (Ve) {
          console.error("Error calling end-chat API:", Ve);
        }
        if ((te = d.attributes) != null && te.end_chat && ((we = d.attributes) != null && we.request_rating)) {
          const Ve = d.agent_name || ((he = k.value) == null ? void 0 : he.human_agent_name) || i.value || "our agent";
          l.value.push({
            message: `Rate the chat session that you had with ${Ve}`,
            message_type: "rating",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            session_id: d.session_id,
            agent_name: Ve,
            showFeedback: !1
          }), Ge.value = d.session_id;
        }
      }
    }, hs = (d) => {
      Ft.value || (Nt.value = d);
    }, mt = () => {
      if (!Ft.value) {
        const d = l.value[l.value.length - 1];
        Nt.value = (d == null ? void 0 : d.selectedRating) || 0;
      }
    }, Qs = async (d) => {
      if (!Ft.value) {
        Nt.value = d;
        const p = l.value[l.value.length - 1];
        p && p.message_type === "rating" && (p.showFeedback = !0, p.selectedRating = d);
      }
    }, ei = async (d, p, u = null) => {
      try {
        Ft.value = !0, await j(p, u);
        const te = l.value.find((we) => we.message_type === "rating");
        te && (te.isSubmitted = !0, te.finalRating = p, te.finalFeedback = u);
      } catch (te) {
        console.error("Failed to submit rating:", te);
      } finally {
        Ft.value = !1;
      }
    }, zc = (d) => {
      const p = {};
      for (const u of d.fields) {
        const te = ft.value[u.name], we = Qi(u, te);
        we && (p[u.name] = we);
      }
      return m.value = p, Object.keys(p).length === 0;
    }, Hc = async (d) => {
      if (!(W.value || !zc(d)))
        try {
          W.value = !0, await V(ft.value);
          const u = l.value.findIndex(
            (te) => te.message_type === "form" && (!te.isSubmitted || te.isSubmitted === !1)
          );
          u !== -1 && l.value.splice(u, 1), ft.value = {}, m.value = {};
        } catch (u) {
          console.error("Failed to submit form:", u);
        } finally {
          W.value = !1;
        }
    }, Ot = (d, p) => {
      var u, te;
      if (ft.value[d] = p, p && p.toString().trim() !== "") {
        let we = null;
        if ((u = Ie.value) != null && u.fields && (we = Ie.value.fields.find((he) => he.name === d)), !we && ((te = Ae.value) != null && te.fields) && (we = Ae.value.fields.find((he) => he.name === d)), we) {
          const he = Qi(we, p);
          he ? (m.value[d] = he, console.log(`Validation error for ${d}:`, he)) : delete m.value[d];
        }
      } else
        delete m.value[d], console.log(`Cleared error for ${d}`);
    }, qc = (d) => {
      const p = d.replace(/\D/g, "");
      return p.length >= 7 && p.length <= 15;
    }, Qi = (d, p) => {
      if (d.required && (!p || p.toString().trim() === ""))
        return `${d.label} is required`;
      if (!p || p.toString().trim() === "")
        return null;
      if (d.type === "email" && !vs(p))
        return "Please enter a valid email address";
      if (d.type === "tel" && !qc(p))
        return "Please enter a valid phone number";
      if ((d.type === "text" || d.type === "textarea") && d.minLength && p.length < d.minLength)
        return `${d.label} must be at least ${d.minLength} characters`;
      if ((d.type === "text" || d.type === "textarea") && d.maxLength && p.length > d.maxLength)
        return `${d.label} must not exceed ${d.maxLength} characters`;
      if (d.type === "number") {
        const u = parseFloat(p);
        if (isNaN(u))
          return `${d.label} must be a valid number`;
        if (d.minLength && u < d.minLength)
          return `${d.label} must be at least ${d.minLength}`;
        if (d.maxLength && u > d.maxLength)
          return `${d.label} must not exceed ${d.maxLength}`;
      }
      return null;
    }, Wc = async () => {
      if (!(W.value || !Ie.value))
        try {
          W.value = !0, m.value = {};
          let d = !1;
          for (const p of Ie.value.fields || []) {
            const u = ft.value[p.name], te = Qi(p, u);
            te && (m.value[p.name] = te, d = !0, console.log(`Validation error for field ${p.name}:`, te));
          }
          if (d) {
            W.value = !1, console.log("Validation failed, not submitting");
            return;
          }
          await V(ft.value), rt.value = !1, Ie.value = null, ft.value = {};
        } catch (d) {
          console.error("Failed to submit full screen form:", d);
        } finally {
          W.value = !1, console.log("Full screen form submission completed");
        }
    }, jc = (d, p) => {
      if (console.log("handleViewDetails called with:", { product: d, shopDomain: p }), !d) {
        console.error("No product provided to handleViewDetails");
        return;
      }
      let u = null;
      if (d.handle && p)
        u = `https://${p}/products/${d.handle}`;
      else if (d.id && p)
        u = `https://${p}/products/${d.id}`;
      else if (p) {
        if (!d.handle && !d.id) {
          console.error("Product handle and ID are both missing! Product:", d), alert("Unable to open product: Product information incomplete.");
          return;
        }
      } else {
        console.error("Shop domain is missing! Product:", d), alert("Unable to open product: Shop domain not available. Please contact support.");
        return;
      }
      u && (console.log("Opening product URL:", u), window.open(u, "_blank"));
    }, Vc = (d) => {
      if (!d) return "";
      let p = d.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "");
      const u = [];
      return p = p.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (te, we, he) => {
        const Ve = `__MARKDOWN_LINK_${u.length}__`;
        return console.log("Found markdown link:", te, "-> placeholder:", Ve), u.push(te), Ve;
      }), console.log("After replacing markdown links with placeholders:", p), console.log("Markdown links array:", u), p = p.replace(/https?:\/\/[^\s\)]+/g, "[link removed]"), console.log("After removing standalone URLs:", p), u.forEach((te, we) => {
        p = p.replace(`__MARKDOWN_LINK_${we}__`, te), console.log(`Restored markdown link ${we}:`, te);
      }), p = p.replace(/\n\s*\n\s*\n/g, `

`).trim(), p;
    }, Io = oe(!1);
    oe(!1);
    const Lo = ue(() => {
      var d;
      return !!((d = k.value) != null && d.human_agent_name);
    }), Kc = ue(() => U.value && Lo.value && st.value.length < tl), Gc = async () => {
      try {
        B.value = !1, Z.value = null, await tt();
      } catch (d) {
        console.error("Failed to proceed workflow:", d);
      }
    }, er = async (d) => {
      try {
        if (!d.userInputValue || !d.userInputValue.trim())
          return;
        const p = d.userInputValue.trim();
        d.isSubmitted = !0, d.submittedValue = p, await K(p, Re.value);
      } catch (p) {
        console.error("Failed to submit user input:", p), d.isSubmitted = !1, d.submittedValue = null;
      }
    }, Oo = async () => {
      var d, p, u;
      try {
        let te = 0;
        const we = 50;
        for (; !((d = window.__INITIAL_DATA__) != null && d.widgetId) && te < we; )
          await new Promise((Ve) => setTimeout(Ve, 100)), te++;
        return (p = window.__INITIAL_DATA__) != null && p.widgetId ? (lt(window.__INITIAL_DATA__.widgetId), await Ut() ? ((u = window.__INITIAL_DATA__) != null && u.workflow && de.value && await Ne(), !0) : (M.value = "connected", !1)) : (console.error("Widget data not available after waiting"), !1);
      } catch (te) {
        return console.error("Failed to initialize widget:", te), !1;
      }
    };
    window.addEventListener("message", (d) => {
      d.source === window.parent && (!d.data || typeof d.data.type != "string" || (d.data.type === "SCROLL_TO_BOTTOM" && Nn(), d.data.type === "TOKEN_RECEIVED" && localStorage.setItem(Cs, d.data.token), d.data.type === "WIDGET_VISIBILITY" && (Uo.value = !!d.data.open), d.data.type === "WIDGET_DISPLAY" && (rr.value = {
        mode: d.data.mode,
        width: d.data.width,
        height: d.data.height,
        hotkey: d.data.hotkey
      }), d.data.type === "PREFILL_MESSAGE" && typeof d.data.text == "string" && (ee.value = d.data.text.slice(0, 2e3), os(() => {
        const p = document.querySelector(
          ".message-input input, .welcome-message-field"
        );
        p == null || p.focus();
      }))));
    });
    const Yc = () => {
      N(async () => {
        await Ut();
      }), Ce((d) => {
        var p;
        if (Je.value = d.button_text || "Start Chat", d.type === "landing_page")
          Z.value = d.landing_page_data, B.value = !0, rt.value = !1;
        else if (d.type === "form" || d.type === "display_form")
          if (((p = d.form_data) == null ? void 0 : p.form_full_screen) === !0)
            Ie.value = d.form_data, rt.value = !0, B.value = !1;
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
            l.value.findIndex(
              (we) => we.message_type === "form" && !we.isSubmitted
            ) === -1 && l.value.push(u), B.value = !1, rt.value = !1;
          }
        else
          B.value = !1, rt.value = !1;
      }), ve((d) => {
        console.log("Workflow proceeded:", d);
      });
    }, Xc = async () => {
      try {
        await Oo(), await Ne();
      } catch (d) {
        throw console.error("Failed to start new conversation:", d), d;
      }
    }, Zc = async () => {
      ht.value = !1, l.value = [], k.value = {}, await Xc();
    };
    ji(async () => {
      await Oo(), Yc(), q(), document.addEventListener("click", g), (() => {
        const p = l.value.length > 0, u = M.value === "connected", te = document.querySelector('input[type="text"], textarea') !== null;
        return p || u || te;
      })() && setTimeout(ae, 100);
    }), Ks(() => {
      window.removeEventListener("message", (d) => {
        d.data.type === "SCROLL_TO_BOTTOM" && Nn();
      }), document.removeEventListener("click", g), Oe && (Oe.disconnect(), Oe = null), q.timeoutId && (clearTimeout(q.timeoutId), q.timeoutId = null), Fe(), be();
    });
    const Xn = ue(() => s.value.chat_style === "AURORA"), Ht = ue(() => s.value.chat_style === "ASK_ANYTHING" || Xn.value), Po = ue(() => s.value.customization_metadata), ti = ue(() => {
      var p;
      const d = (p = Po.value) == null ? void 0 : p.avatar_style;
      return d === "orb" ? !0 : d === "photo" ? !1 : Xn.value && !s.value.photo_url;
    }), ds = ue(() => {
      var d;
      return lp(i.value || "", (d = Po.value) == null ? void 0 : d.orb_variant);
    }), Jc = {
      GLASS: "theme-glass",
      TERMINAL: "theme-terminal",
      PLAYFUL: "theme-playful",
      CALM_MINT: "theme-calm",
      SUNRISE: "theme-sunrise"
    }, Qc = ue(() => Jc[s.value.chat_style] || ""), eu = ue(() => Cg(s.value.chat_style, {
      chat_background_color: s.value.chat_background_color,
      chat_text_color: s.value.chat_text_color,
      accent_color: s.value.accent_color,
      font_family: s.value.font_family
    })), tr = ue(
      () => Array.isArray(s.value.quick_actions) ? s.value.quick_actions.filter((d) => !!d && d.trim().length > 0) : []
    ), Mo = ue(() => (s.value.welcome_message || "").trim()), No = ue(
      () => !Ht.value && l.value.length === 0 && !_.value && !Zn.value
    ), tu = ue(
      () => No.value && Mo.value.length > 0
    ), nu = ue(
      () => No.value && !ht.value && tr.value.length > 0
    ), ni = ue(() => s.value.show_citations === !0), Fo = ue(() => cp(s.value.show_ai_disclaimer, Lo.value)), su = (d) => /^[0-9a-f]{16,}$/i.test(d) || /^[0-9a-f-]{32,}$/i.test(d), nr = (d) => {
      const p = (d || "").trim().toLowerCase();
      return !p || p === "unknown" ? "Knowledge base" : p.charAt(0).toUpperCase() + p.slice(1);
    }, sr = (d) => {
      let p = ((d == null ? void 0 : d.name) || "").trim();
      return !p || (p = p.replace(/^[0-9a-f]{16,}[_-]/i, "").replace(/\.(pdf|txt|md|html?|docx?|csv|json)$/i, ""), !p || su(p)) ? nr(d == null ? void 0 : d.type) : p;
    }, Do = (d) => {
      const p = sr(d), u = nr(d == null ? void 0 : d.type);
      return p === u ? u : `${p} · ${u}`;
    }, ir = ue(() => s.value.collect_email === !0 && !Ht.value), Bo = oe(!1), xn = oe(""), ps = oe(!1), Zn = ue(() => !P.value && ir.value && !Bo.value), $o = async () => {
      const d = Re.value.trim();
      if (!d) {
        xn.value = "Please enter your email address.";
        return;
      }
      if (!vs(d)) {
        xn.value = "Please enter a valid email address.";
        return;
      }
      xn.value = "", ps.value = !0;
      try {
        await Ut(), Bo.value = !0;
      } catch {
        xn.value = "Something went wrong. Please try again.";
      } finally {
        ps.value = !1;
      }
    }, rr = oe(null), Uo = oe(!0), or = { mode: "floating", width: 400, height: 560 }, si = ue(
      () => {
        var d;
        return rr.value || ((d = s.value.customization_metadata) == null ? void 0 : d.widget_display) || null;
      }
    ), iu = ue(() => {
      const d = si.value;
      return d ? typeof d.mode == "string" && d.mode !== or.mode || typeof d.width == "number" && d.width !== or.width || typeof d.height == "number" && d.height !== or.height : !1;
    }), ru = ue(() => {
      var p;
      const d = {
        width: "100%",
        height: "100%",
        borderRadius: "var(--radius-lg)"
      };
      if (iu.value) {
        const u = (p = si.value) == null ? void 0 : p.mode;
        return u === "sidebar-left" || u === "sidebar-right" ? { ...d, borderRadius: "0" } : d;
      }
      return Ht.value ? window.innerWidth <= 768 ? {
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
    }), zo = ue(() => Ht.value && l.value.length === 0), ou = ["form", "user_input", "rating", "product", "shopify_output"], au = ue(
      () => l.value.some(
        (d) => ou.includes(d.message_type) || Array.isArray(d.attachments) && d.attachments.length > 0
      )
    ), lu = ue(() => {
      var p, u;
      return Ht.value ? !0 : (((p = si.value) == null ? void 0 : p.mode) === "ask-ai" || ((u = si.value) == null ? void 0 : u.mode) === "search-bar") && !U.value;
    }), ar = ue(
      () => lu.value && ot.value && !B.value && !rt.value && !Zn.value && !ht.value && !au.value
    );
    jt(ar, (d) => {
      window.parent.postMessage({ type: "WIDGET_SURFACE", palette: d }, "*");
    }, { immediate: !0 });
    const cu = ue(
      () => s.value.welcome_subtitle || `Ask a question — ${i.value || "the assistant"} answers from what it knows.`
    ), uu = ue(() => {
      var d;
      return ((d = rr.value) == null ? void 0 : d.hotkey) !== !1;
    });
    return (d, p) => R.value && z.value ? (x(), T("div", Ig, [
      b("button", {
        type: "button",
        class: "cm-error-close",
        "aria-label": "Close chat",
        title: "Close",
        onClick: Kn
      }, "×"),
      p[20] || (p[20] = Un('<div class="widget-unavailable-card" data-v-de1b0657><div class="widget-unavailable-icon-wrapper" data-v-de1b0657><svg class="widget-unavailable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-de1b0657><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" data-v-de1b0657></path><path d="M9 12l2 2 4-4" data-v-de1b0657></path></svg></div><h2 class="widget-unavailable-title" data-v-de1b0657>Chat Unavailable</h2><p class="widget-unavailable-message" data-v-de1b0657> This chat widget is not currently configured. Please contact the website administrator to enable chat support. </p><div class="widget-unavailable-footer" data-v-de1b0657><svg class="chattermate-logo-small" width="14" height="14" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-de1b0657><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-de1b0657></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-de1b0657><span class="cm-powered-prefix" data-v-de1b0657>Powered by </span><strong class="cm-brand" data-v-de1b0657>ChatterMate</strong></a></div></div>', 1))
    ])) : R.value ? (x(), T("div", Lg, [
      b("button", {
        type: "button",
        class: "cm-error-close",
        "aria-label": "Close chat",
        title: "Close",
        onClick: Kn
      }, "×"),
      b("div", Og, [
        p[21] || (p[21] = Un('<div class="auth-error-header" data-v-de1b0657><svg class="auth-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-de1b0657><circle cx="12" cy="12" r="10" data-v-de1b0657></circle><line x1="12" y1="8" x2="12" y2="12" data-v-de1b0657></line><line x1="12" y1="16" x2="12.01" y2="16" data-v-de1b0657></line></svg><h2 data-v-de1b0657>Authentication Error</h2></div>', 1)),
        b("p", Pg, ne(L.value), 1),
        b("button", {
          class: "auth-error-refresh-btn",
          onClick: p[0] || (p[0] = () => d.window.location.reload())
        }, " Refresh Page ")
      ])
    ])) : n.value && !R.value ? (x(), T("div", {
      key: 2,
      class: Ke(["chat-container cm-surface", [{ collapsed: !ot.value, "ask-anything-style": Ht.value, aurora: Xn.value }, Qc.value]]),
      style: Te({ ...E(ut), ...ru.value, ...eu.value })
    }, [
      y.value ? (x(), T("div", Mg, p[22] || (p[22] = [
        Un('<div class="loading-spinner" data-v-de1b0657><div class="dot" data-v-de1b0657></div><div class="dot" data-v-de1b0657></div><div class="dot" data-v-de1b0657></div></div><div class="loading-text" data-v-de1b0657>Initializing chat...</div>', 2)
      ]))) : re("", !0),
      !y.value && E(M) !== "connected" ? (x(), T("div", {
        key: 1,
        class: Ke(["connection-status", E(M)])
      }, [
        E(M) === "connecting" ? (x(), T("div", Ng, p[23] || (p[23] = [
          dn(" Connecting to chat service... ", -1),
          b("div", { class: "loading-dots" }, [
            b("div", { class: "dot" }),
            b("div", { class: "dot" }),
            b("div", { class: "dot" })
          ], -1)
        ]))) : E(M) === "failed" ? (x(), T("div", Fg, [
          p[24] || (p[24] = dn(" Connection failed. ", -1)),
          b("button", {
            onClick: Js,
            class: "reconnect-button"
          }, " Click here to reconnect ")
        ])) : re("", !0)
      ], 2)) : re("", !0),
      E(w) ? (x(), T("div", {
        key: 2,
        class: "error-alert",
        style: Te(E(H))
      }, ne(E(c)), 5)) : re("", !0),
      ar.value ? (x(), ec(rp, {
        key: 3,
        messages: E(l),
        draft: ee.value,
        "agent-name": E(i),
        suggestions: tr.value,
        "welcome-title": E(s).welcome_title,
        "welcome-subtitle": cu.value,
        placeholder: Mn.value,
        "input-enabled": $t.value,
        loading: E(h),
        "show-citations": ni.value,
        disclaimer: Fo.value ? E(Wa) : "",
        active: Uo.value,
        hotkey: uu.value,
        "citation-label": sr,
        "citation-tooltip": Do,
        "display-text": E(le),
        "is-streaming": E(ge),
        "onUpdate:draft": p[1] || (p[1] = (u) => ee.value = u),
        onSend: tn,
        onAsk: fs,
        onClose: Kn
      }, null, 8, ["messages", "draft", "agent-name", "suggestions", "welcome-title", "welcome-subtitle", "placeholder", "input-enabled", "loading", "show-citations", "disclaimer", "active", "hotkey", "display-text", "is-streaming"])) : zo.value ? (x(), T("div", {
        key: 4,
        class: Ke(["welcome-message-section", { aurora: Xn.value }]),
        style: Te(E(J))
      }, [
        b("div", Dg, [
          b("div", Bg, [
            ti.value ? (x(), T("div", {
              key: 0,
              class: "welcome-orb",
              style: Te(ds.value)
            }, null, 4)) : E(ce) ? (x(), T("img", {
              key: 1,
              src: E(ce),
              alt: E(i),
              class: "welcome-avatar"
            }, null, 8, $g)) : re("", !0),
            b("h1", Ug, ne(E(s).welcome_title || `Welcome to ${E(i)}`), 1),
            b("p", zg, ne(E(s).welcome_subtitle || "I'm here to help you with anything you need. What can I assist you with today?"), 1)
          ])
        ]),
        b("div", Hg, [
          !E(P) && !de.value && ir.value ? (x(), T("div", qg, [
            An(b("input", {
              "onUpdate:modelValue": p[2] || (p[2] = (u) => Re.value = u),
              type: "email",
              placeholder: "Enter your email address",
              disabled: E(h) || E(M) !== "connected",
              class: Ke([{
                invalid: Re.value.trim() && !E(vs)(Re.value.trim()),
                disabled: E(M) !== "connected"
              }, "welcome-email-input"])
            }, null, 10, Wg), [
              [zn, Re.value]
            ])
          ])) : re("", !0),
          b("div", jg, [
            An(b("input", {
              "onUpdate:modelValue": p[3] || (p[3] = (u) => ee.value = u),
              type: "text",
              placeholder: Mn.value,
              onKeypress: Mt,
              onInput: Ye,
              onChange: Ye,
              disabled: !$t.value,
              class: Ke([{ disabled: !$t.value }, "welcome-message-field"])
            }, null, 42, Vg), [
              [zn, ee.value]
            ]),
            b("button", {
              class: Ke(["welcome-send-button", { "aurora-send": Xn.value }]),
              style: Te(E(Q)),
              onClick: tn,
              disabled: !ee.value.trim() || !$t.value
            }, [
              Xn.value ? (x(), T("svg", Gg, p[25] || (p[25] = [
                b("path", {
                  d: "M12 19V5M12 5L5 12M12 5L19 12",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, null, -1)
              ]))) : (x(), T("svg", Yg, p[26] || (p[26] = [
                b("path", {
                  d: "M5 12L3 21L21 12L3 3L5 12ZM5 12L13 12",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, null, -1)
              ])))
            ], 14, Kg)
          ])
        ]),
        b("div", {
          class: "powered-by-welcome",
          style: Te(E(ie))
        }, p[27] || (p[27] = [
          Un('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-de1b0657><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-de1b0657></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-de1b0657><span class="cm-powered-prefix" data-v-de1b0657>Powered by </span><strong class="cm-brand" data-v-de1b0657>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 6)) : re("", !0),
      B.value && Z.value ? (x(), T("div", {
        key: 5,
        class: "landing-page-fullscreen",
        style: Te(E(J))
      }, [
        b("div", Xg, [
          b("div", Zg, [
            b("h2", Jg, ne(Z.value.heading), 1),
            b("div", Qg, ne(Z.value.content), 1)
          ]),
          b("div", em, [
            b("button", {
              class: "landing-page-button",
              onClick: Gc
            }, ne(Je.value), 1)
          ])
        ]),
        b("div", {
          class: "powered-by-landing",
          style: Te(E(ie))
        }, p[28] || (p[28] = [
          Un('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-de1b0657><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-de1b0657></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-de1b0657><span class="cm-powered-prefix" data-v-de1b0657>Powered by </span><strong class="cm-brand" data-v-de1b0657>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 4)) : rt.value && Ie.value ? (x(), T("div", {
        key: 6,
        class: "form-fullscreen",
        style: Te(E(J))
      }, [
        b("div", tm, [
          Ie.value.title || Ie.value.description ? (x(), T("div", nm, [
            Ie.value.title ? (x(), T("h2", sm, ne(Ie.value.title), 1)) : re("", !0),
            Ie.value.description ? (x(), T("p", im, ne(Ie.value.description), 1)) : re("", !0)
          ])) : re("", !0),
          b("div", rm, [
            (x(!0), T(Be, null, vt(Ie.value.fields, (u) => {
              var te, we;
              return x(), T("div", {
                key: u.name,
                class: "form-field"
              }, [
                b("label", {
                  for: `fullscreen-form-${u.name}`,
                  class: "field-label"
                }, [
                  dn(ne(u.label) + " ", 1),
                  u.required ? (x(), T("span", am, "*")) : re("", !0)
                ], 8, om),
                u.type === "text" || u.type === "email" || u.type === "tel" ? (x(), T("input", {
                  key: 0,
                  id: `fullscreen-form-${u.name}`,
                  type: u.type,
                  placeholder: u.placeholder || "",
                  required: u.required,
                  minlength: u.minLength,
                  maxlength: u.maxLength,
                  value: ft.value[u.name] || "",
                  onInput: (he) => Ot(u.name, he.target.value),
                  onBlur: (he) => Ot(u.name, he.target.value),
                  class: Ke(["form-input", { error: m.value[u.name] }]),
                  autocomplete: u.type === "email" ? "email" : u.type === "tel" ? "tel" : "off",
                  inputmode: u.type === "tel" ? "tel" : u.type === "email" ? "email" : "text"
                }, null, 42, lm)) : u.type === "number" ? (x(), T("input", {
                  key: 1,
                  id: `fullscreen-form-${u.name}`,
                  type: "number",
                  placeholder: u.placeholder || "",
                  required: u.required,
                  min: u.minLength,
                  max: u.maxLength,
                  value: ft.value[u.name] || "",
                  onInput: (he) => Ot(u.name, he.target.value),
                  class: Ke(["form-input", { error: m.value[u.name] }])
                }, null, 42, cm)) : u.type === "textarea" ? (x(), T("textarea", {
                  key: 2,
                  id: `fullscreen-form-${u.name}`,
                  placeholder: u.placeholder || "",
                  required: u.required,
                  minlength: u.minLength,
                  maxlength: u.maxLength,
                  value: ft.value[u.name] || "",
                  onInput: (he) => Ot(u.name, he.target.value),
                  class: Ke(["form-textarea", { error: m.value[u.name] }]),
                  rows: "4"
                }, null, 42, um)) : u.type === "select" ? (x(), T("select", {
                  key: 3,
                  id: `fullscreen-form-${u.name}`,
                  required: u.required,
                  value: ft.value[u.name] || "",
                  onChange: (he) => Ot(u.name, he.target.value),
                  class: Ke(["form-select", { error: m.value[u.name] }])
                }, [
                  b("option", hm, ne(u.placeholder || "Please select..."), 1),
                  (x(!0), T(Be, null, vt((Array.isArray(u.options) ? u.options : ((te = u.options) == null ? void 0 : te.split(`
`)) || []).filter((he) => he.trim()), (he) => (x(), T("option", {
                    key: he,
                    value: he.trim()
                  }, ne(he.trim()), 9, dm))), 128))
                ], 42, fm)) : u.type === "checkbox" ? (x(), T("label", pm, [
                  b("input", {
                    id: `fullscreen-form-${u.name}`,
                    type: "checkbox",
                    required: u.required,
                    checked: ft.value[u.name] || !1,
                    onChange: (he) => Ot(u.name, he.target.checked),
                    class: "form-checkbox"
                  }, null, 40, gm),
                  b("span", mm, ne(u.label), 1)
                ])) : u.type === "radio" ? (x(), T("div", _m, [
                  (x(!0), T(Be, null, vt((Array.isArray(u.options) ? u.options : ((we = u.options) == null ? void 0 : we.split(`
`)) || []).filter((he) => he.trim()), (he) => (x(), T("label", {
                    key: he,
                    class: "radio-field"
                  }, [
                    b("input", {
                      type: "radio",
                      name: `fullscreen-form-${u.name}`,
                      value: he.trim(),
                      required: u.required,
                      checked: ft.value[u.name] === he.trim(),
                      onChange: (Ve) => Ot(u.name, he.trim()),
                      class: "form-radio"
                    }, null, 40, ym),
                    b("span", vm, ne(he.trim()), 1)
                  ]))), 128))
                ])) : re("", !0),
                m.value[u.name] ? (x(), T("div", bm, ne(m.value[u.name]), 1)) : re("", !0)
              ]);
            }), 128))
          ]),
          b("div", wm, [
            b("button", {
              onClick: p[4] || (p[4] = () => {
                console.log("Submit button clicked!"), Wc();
              }),
              disabled: W.value,
              class: "submit-form-button",
              style: Te(E(Q))
            }, [
              W.value ? (x(), T("span", xm, p[29] || (p[29] = [
                b("div", { class: "dot" }, null, -1),
                b("div", { class: "dot" }, null, -1),
                b("div", { class: "dot" }, null, -1)
              ]))) : (x(), T("span", Am, ne(Ie.value.submit_button_text || "Submit"), 1))
            ], 12, km)
          ])
        ]),
        b("div", {
          class: "powered-by-landing",
          style: Te(E(ie))
        }, p[30] || (p[30] = [
          Un('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-de1b0657><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-de1b0657></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-de1b0657><span class="cm-powered-prefix" data-v-de1b0657>Powered by </span><strong class="cm-brand" data-v-de1b0657>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 4)) : !zo.value && ot.value && !ar.value ? (x(), T("div", {
        key: 7,
        class: Ke(["chat-panel", { "ask-anything-chat": Ht.value }]),
        style: Te(E(J))
      }, [
        Ht.value ? (x(), T("div", {
          key: 1,
          class: "ask-anything-top",
          style: Te(E(Pe))
        }, [
          b("div", Cm, [
            yt.value || E(ce) ? (x(), T("img", {
              key: 0,
              src: yt.value || E(ce),
              alt: E(k).human_agent_name || E(i),
              class: "header-avatar"
            }, null, 8, Rm)) : re("", !0),
            b("div", Im, [
              b("h3", {
                style: Te(E(ie))
              }, ne(E(i)), 5),
              b("p", {
                class: "ask-anything-subtitle",
                style: Te(E(ie))
              }, ne(E(s).welcome_subtitle || "Ask me anything. I'm here to help."), 5)
            ])
          ])
        ], 4)) : (x(), T("div", {
          key: 0,
          class: "chat-header",
          style: Te(E(Pe))
        }, [
          b("div", {
            class: "cm-header-sheen",
            style: Te({ background: "linear-gradient(90deg, transparent, " + (E(s).accent_color || "#C9F24E") + ", transparent)" })
          }, null, 4),
          b("div", Tm, [
            !yt.value && (ti.value || !E(ce)) ? (x(), T("div", {
              key: 0,
              class: "header-orb",
              style: Te(ds.value)
            }, null, 4)) : yt.value || E(ce) ? (x(), T("img", {
              key: 1,
              src: yt.value || E(ce),
              alt: E(k).human_agent_name || E(i),
              class: "header-avatar"
            }, null, 8, Sm)) : re("", !0),
            b("div", Em, [
              b("h3", {
                style: Te(E(ie))
              }, ne(E(k).human_agent_name || E(i)), 5),
              p[31] || (p[31] = b("div", { class: "status" }, [
                b("span", { class: "status-indicator online" }),
                b("span", { class: "status-text cm-presence" }, "Online · replies instantly")
              ], -1))
            ])
          ]),
          b("button", {
            type: "button",
            class: "header-minimize",
            style: Te(E(ie)),
            title: "Minimize",
            "aria-label": "Minimize chat",
            onClick: Kn
          }, p[32] || (p[32] = [
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
        ], 4)),
        E(_) ? (x(), T("div", Lm, p[33] || (p[33] = [
          b("div", { class: "loading-spinner" }, [
            b("div", { class: "dot" }),
            b("div", { class: "dot" }),
            b("div", { class: "dot" })
          ], -1)
        ]))) : re("", !0),
        Zn.value ? (x(), T("div", {
          key: 3,
          class: "cm-email-gate",
          style: Te(E(J))
        }, [
          b("div", {
            class: "cm-email-gate-orb",
            style: Te(ds.value)
          }, null, 4),
          b("h3", Om, ne(E(s).welcome_title || "Before we start"), 1),
          p[34] || (p[34] = b("p", { class: "cm-email-gate-text" }, "Enter your email and we'll continue the chat.", -1)),
          An(b("input", {
            "onUpdate:modelValue": p[5] || (p[5] = (u) => Re.value = u),
            type: "email",
            inputmode: "email",
            autocomplete: "email",
            placeholder: "you@example.com",
            class: Ke(["cm-email-gate-input", { invalid: !!xn.value }]),
            disabled: ps.value,
            onKeyup: _i($o, ["enter"]),
            onInput: p[6] || (p[6] = (u) => xn.value = "")
          }, null, 42, Pm), [
            [zn, Re.value]
          ]),
          xn.value ? (x(), T("p", Mm, ne(xn.value), 1)) : re("", !0),
          b("button", {
            type: "button",
            class: "cm-email-gate-btn",
            style: Te(E(Q)),
            disabled: ps.value,
            onClick: $o
          }, ne(ps.value ? "Please wait…" : "Continue to chat"), 13, Nm)
        ], 4)) : re("", !0),
        An(b("div", {
          class: "chat-messages",
          ref_key: "messagesContainer",
          ref: F
        }, [
          tu.value ? (x(), T("div", Fm, [
            b("div", Dm, [
              ti.value || !E(ce) ? (x(), T("div", {
                key: 0,
                class: "cm-welcome-orb",
                style: Te(ds.value)
              }, null, 4)) : (x(), T("img", {
                key: 1,
                src: E(ce),
                alt: E(i),
                class: "cm-welcome-avatar"
              }, null, 8, Bm)),
              b("div", {
                class: "message-bubble cm-welcome-bubble",
                style: Te(E(Y))
              }, ne(Mo.value), 5)
            ])
          ])) : re("", !0),
          (x(!0), T(Be, null, vt(E(l), (u, te) => {
            var we, he, Ve, xe, Xt, gs, Jn, qo, Wo, jo, Vo, Ko, Go, Yo, Xo, Zo, Jo, Qo, ea;
            return x(), T("div", {
              key: te,
              class: Ke([
                "message",
                u.message_type === "bot" || u.message_type === "agent" ? "agent-message" : u.message_type === "system" ? "system-message" : u.message_type === "rating" ? "rating-message" : u.message_type === "form" ? "form-message" : u.message_type === "product" || u.shopify_output ? "product-message" : "user-message"
              ])
            }, [
              u.message_type === "bot" || u.message_type === "agent" ? (x(), T("div", $m, [
                yt.value ? (x(), T("img", {
                  key: 0,
                  src: yt.value,
                  class: "cm-msg-avatar-img",
                  alt: ""
                }, null, 8, Um)) : !ti.value && E(ce) ? (x(), T("img", {
                  key: 1,
                  src: E(ce),
                  class: "cm-msg-avatar-img",
                  alt: ""
                }, null, 8, zm)) : (x(), T("div", {
                  key: 2,
                  class: "cm-msg-avatar-orb",
                  style: Te(ds.value)
                }, null, 4))
              ])) : re("", !0),
              b("div", Hm, [
                b("div", {
                  class: "message-bubble",
                  style: Te(u.message_type === "system" || u.message_type === "rating" || u.message_type === "form" || u.message_type === "product" || u.shopify_output ? {} : u.message_type === "user" ? E(Q) : E(Y))
                }, [
                  u.message_type === "rating" ? (x(), T("div", qm, [
                    b("p", Wm, "Rate the chat session that you had with " + ne(u.agent_name || E(k).human_agent_name || E(i) || "our agent"), 1),
                    b("div", {
                      class: Ke(["star-rating", { submitted: Ft.value || u.isSubmitted }])
                    }, [
                      (x(), T(Be, null, vt(5, (O) => b("button", {
                        key: O,
                        class: Ke(["star-button", {
                          warning: O <= (u.isSubmitted ? u.finalRating : Nt.value || u.selectedRating) && (u.isSubmitted ? u.finalRating : Nt.value || u.selectedRating) <= 3,
                          success: O <= (u.isSubmitted ? u.finalRating : Nt.value || u.selectedRating) && (u.isSubmitted ? u.finalRating : Nt.value || u.selectedRating) > 3,
                          selected: O <= (u.isSubmitted ? u.finalRating : Nt.value || u.selectedRating)
                        }]),
                        onMouseover: (Zt) => !u.isSubmitted && hs(O),
                        onMouseleave: (Zt) => !u.isSubmitted && mt,
                        onClick: (Zt) => !u.isSubmitted && Qs(O),
                        disabled: Ft.value || u.isSubmitted
                      }, " ★ ", 42, jm)), 64))
                    ], 2),
                    u.showFeedback && !u.isSubmitted ? (x(), T("div", Vm, [
                      b("div", Km, [
                        An(b("input", {
                          "onUpdate:modelValue": (O) => u.feedback = O,
                          placeholder: "Please share your feedback (optional)",
                          disabled: Ft.value,
                          maxlength: "500",
                          class: "feedback-input"
                        }, null, 8, Gm), [
                          [zn, u.feedback]
                        ]),
                        b("div", Ym, ne(((we = u.feedback) == null ? void 0 : we.length) || 0) + "/500", 1)
                      ]),
                      b("button", {
                        onClick: (O) => ei(u.session_id, Nt.value, u.feedback),
                        disabled: Ft.value || !Nt.value,
                        class: "submit-rating-button",
                        style: Te({ backgroundColor: E(s).accent_color || "var(--accent-solid)" })
                      }, ne(Ft.value ? "Submitting..." : "Submit Rating"), 13, Xm)
                    ])) : re("", !0),
                    u.isSubmitted && u.finalFeedback ? (x(), T("div", Zm, [
                      b("div", Jm, [
                        b("p", Qm, ne(u.finalFeedback), 1)
                      ])
                    ])) : u.isSubmitted ? (x(), T("div", e_, " Thank you for your rating! ")) : re("", !0)
                  ])) : u.message_type === "form" ? (x(), T("div", t_, [
                    (Ve = (he = u.attributes) == null ? void 0 : he.form_data) != null && Ve.title || (Xt = (xe = u.attributes) == null ? void 0 : xe.form_data) != null && Xt.description ? (x(), T("div", n_, [
                      (Jn = (gs = u.attributes) == null ? void 0 : gs.form_data) != null && Jn.title ? (x(), T("h3", s_, ne(u.attributes.form_data.title), 1)) : re("", !0),
                      (Wo = (qo = u.attributes) == null ? void 0 : qo.form_data) != null && Wo.description ? (x(), T("p", i_, ne(u.attributes.form_data.description), 1)) : re("", !0)
                    ])) : re("", !0),
                    b("div", r_, [
                      (x(!0), T(Be, null, vt((Vo = (jo = u.attributes) == null ? void 0 : jo.form_data) == null ? void 0 : Vo.fields, (O) => {
                        var Zt, lr;
                        return x(), T("div", {
                          key: O.name,
                          class: "form-field"
                        }, [
                          b("label", {
                            for: `form-${O.name}`,
                            class: "field-label"
                          }, [
                            dn(ne(O.label) + " ", 1),
                            O.required ? (x(), T("span", a_, "*")) : re("", !0)
                          ], 8, o_),
                          O.type === "text" || O.type === "email" || O.type === "tel" ? (x(), T("input", {
                            key: 0,
                            id: `form-${O.name}`,
                            type: O.type,
                            placeholder: O.placeholder || "",
                            required: O.required,
                            minlength: O.minLength,
                            maxlength: O.maxLength,
                            value: ft.value[O.name] || "",
                            onInput: (He) => Ot(O.name, He.target.value),
                            onBlur: (He) => Ot(O.name, He.target.value),
                            class: Ke(["form-input", { error: m.value[O.name] }]),
                            disabled: W.value,
                            autocomplete: O.type === "email" ? "email" : O.type === "tel" ? "tel" : "off",
                            inputmode: O.type === "tel" ? "tel" : O.type === "email" ? "email" : "text"
                          }, null, 42, l_)) : O.type === "number" ? (x(), T("input", {
                            key: 1,
                            id: `form-${O.name}`,
                            type: "number",
                            placeholder: O.placeholder || "",
                            required: O.required,
                            min: O.min,
                            max: O.max,
                            value: ft.value[O.name] || "",
                            onInput: (He) => Ot(O.name, He.target.value),
                            class: Ke(["form-input", { error: m.value[O.name] }]),
                            disabled: W.value
                          }, null, 42, c_)) : O.type === "textarea" ? (x(), T("textarea", {
                            key: 2,
                            id: `form-${O.name}`,
                            placeholder: O.placeholder || "",
                            required: O.required,
                            minlength: O.minLength,
                            maxlength: O.maxLength,
                            value: ft.value[O.name] || "",
                            onInput: (He) => Ot(O.name, He.target.value),
                            class: Ke(["form-textarea", { error: m.value[O.name] }]),
                            disabled: W.value,
                            rows: "3"
                          }, null, 42, u_)) : O.type === "select" ? (x(), T("select", {
                            key: 3,
                            id: `form-${O.name}`,
                            required: O.required,
                            value: ft.value[O.name] || "",
                            onChange: (He) => Ot(O.name, He.target.value),
                            class: Ke(["form-select", { error: m.value[O.name] }]),
                            disabled: W.value
                          }, [
                            b("option", h_, ne(O.placeholder || "Select an option"), 1),
                            (x(!0), T(Be, null, vt((Array.isArray(O.options) ? O.options : ((Zt = O.options) == null ? void 0 : Zt.split(`
`)) || []).filter((He) => He.trim()), (He) => (x(), T("option", {
                              key: He.trim(),
                              value: He.trim()
                            }, ne(He.trim()), 9, d_))), 128))
                          ], 42, f_)) : O.type === "checkbox" ? (x(), T("div", p_, [
                            b("input", {
                              id: `form-${O.name}`,
                              type: "checkbox",
                              checked: ft.value[O.name] || !1,
                              onChange: (He) => Ot(O.name, He.target.checked),
                              class: "form-checkbox",
                              disabled: W.value
                            }, null, 40, g_),
                            b("label", {
                              for: `form-${O.name}`,
                              class: "checkbox-label"
                            }, ne(O.placeholder || O.label), 9, m_)
                          ])) : O.type === "radio" ? (x(), T("div", __, [
                            (x(!0), T(Be, null, vt((Array.isArray(O.options) ? O.options : ((lr = O.options) == null ? void 0 : lr.split(`
`)) || []).filter((He) => He.trim()), (He) => (x(), T("div", {
                              key: He.trim(),
                              class: "radio-option"
                            }, [
                              b("input", {
                                id: `form-${O.name}-${He.trim()}`,
                                name: `form-${O.name}`,
                                type: "radio",
                                value: He.trim(),
                                checked: ft.value[O.name] === He.trim(),
                                onChange: (By) => Ot(O.name, He.trim()),
                                class: "form-radio",
                                disabled: W.value
                              }, null, 40, y_),
                              b("label", {
                                for: `form-${O.name}-${He.trim()}`,
                                class: "radio-label"
                              }, ne(He.trim()), 9, v_)
                            ]))), 128))
                          ])) : re("", !0),
                          m.value[O.name] ? (x(), T("div", b_, ne(m.value[O.name]), 1)) : re("", !0)
                        ]);
                      }), 128))
                    ]),
                    b("div", w_, [
                      b("button", {
                        onClick: () => {
                          var O;
                          console.log("Regular form submit button clicked!"), Hc((O = u.attributes) == null ? void 0 : O.form_data);
                        },
                        disabled: W.value,
                        class: "form-submit-button",
                        style: Te(E(Q))
                      }, ne(W.value ? "Submitting..." : ((Go = (Ko = u.attributes) == null ? void 0 : Ko.form_data) == null ? void 0 : Go.submit_button_text) || "Submit"), 13, k_)
                    ])
                  ])) : u.message_type === "user_input" ? (x(), T("div", x_, [
                    (Yo = u.attributes) != null && Yo.prompt_message && u.attributes.prompt_message.trim() ? (x(), T("div", A_, ne(u.attributes.prompt_message), 1)) : re("", !0),
                    u.isSubmitted ? (x(), T("div", C_, [
                      p[35] || (p[35] = b("strong", null, "Your input:", -1)),
                      dn(" " + ne(u.submittedValue) + " ", 1),
                      (Xo = u.attributes) != null && Xo.confirmation_message && u.attributes.confirmation_message.trim() ? (x(), T("div", R_, ne(u.attributes.confirmation_message), 1)) : re("", !0)
                    ])) : (x(), T("div", T_, [
                      An(b("textarea", {
                        "onUpdate:modelValue": (O) => u.userInputValue = O,
                        class: "user-input-textarea",
                        placeholder: "Type your message here...",
                        rows: "3",
                        onKeydown: [
                          _i(qn((O) => er(u), ["ctrl"]), ["enter"]),
                          _i(qn((O) => er(u), ["meta"]), ["enter"])
                        ]
                      }, null, 40, S_), [
                        [zn, u.userInputValue]
                      ]),
                      b("button", {
                        class: "user-input-submit-button",
                        onClick: (O) => er(u),
                        disabled: !u.userInputValue || !u.userInputValue.trim()
                      }, " Submit ", 8, E_)
                    ]))
                  ])) : u.shopify_output || u.message_type === "product" ? (x(), T("div", I_, [
                    u.message ? (x(), T("div", {
                      key: 0,
                      innerHTML: E(bi)(((Jo = (Zo = u.shopify_output) == null ? void 0 : Zo.products) == null ? void 0 : Jo.length) > 0 ? Vc(u.message) : u.message),
                      class: "product-message-text"
                    }, null, 8, L_)) : re("", !0),
                    (Qo = u.shopify_output) != null && Qo.products && u.shopify_output.products.length > 0 ? (x(), T("div", O_, [
                      p[37] || (p[37] = b("h3", { class: "carousel-title" }, "Products", -1)),
                      b("div", P_, [
                        (x(!0), T(Be, null, vt(u.shopify_output.products, (O) => {
                          var Zt;
                          return x(), T("div", {
                            key: O.id,
                            class: "product-card-compact carousel-item"
                          }, [
                            (Zt = O.image) != null && Zt.src ? (x(), T("div", M_, [
                              b("img", {
                                src: O.image.src,
                                alt: O.title,
                                class: "product-thumbnail"
                              }, null, 8, N_)
                            ])) : re("", !0),
                            b("div", F_, [
                              b("div", D_, [
                                b("div", B_, ne(O.title), 1),
                                O.variant_title && O.variant_title !== "Default Title" ? (x(), T("div", $_, ne(O.variant_title), 1)) : re("", !0),
                                b("div", U_, ne(O.price_formatted || E(a)(O.price, O.currency)), 1)
                              ]),
                              b("div", z_, [
                                b("button", {
                                  class: "view-details-button-compact",
                                  onClick: (lr) => {
                                    var He;
                                    return jc(O, (He = u.shopify_output) == null ? void 0 : He.shop_domain);
                                  }
                                }, p[36] || (p[36] = [
                                  dn(" View product ", -1),
                                  b("span", { class: "external-link-icon" }, "↗", -1)
                                ]), 8, H_)
                              ])
                            ])
                          ]);
                        }), 128))
                      ])
                    ])) : !u.message && ((ea = u.shopify_output) != null && ea.products) && u.shopify_output.products.length === 0 ? (x(), T("div", q_, p[38] || (p[38] = [
                      b("p", null, "No products found.", -1)
                    ]))) : !u.message && u.shopify_output && !u.shopify_output.products ? (x(), T("div", W_, p[39] || (p[39] = [
                      b("p", null, "No products to display.", -1)
                    ]))) : re("", !0)
                  ])) : (x(), T(Be, { key: 4 }, [
                    E(ge)(te) ? (x(), T("div", {
                      key: 0,
                      class: "message-streaming",
                      innerHTML: E(bi)(E(le)(te, u.message))
                    }, null, 8, j_)) : (x(), T("div", {
                      key: 1,
                      innerHTML: E(bi)(u.message)
                    }, null, 8, V_)),
                    u.attachments && u.attachments.length > 0 ? (x(), T("div", K_, [
                      (x(!0), T(Be, null, vt(u.attachments, (O) => (x(), T("div", {
                        key: O.id,
                        class: "attachment-item"
                      }, [
                        E(S)(O.content_type) ? (x(), T("div", G_, [
                          b("img", {
                            src: E(D)(O.file_url),
                            alt: O.filename,
                            class: "attachment-image",
                            onClick: qn((Zt) => E(_t)({ url: O.file_url, filename: O.filename, type: O.content_type, file_url: E(D)(O.file_url), size: void 0 }), ["stop"]),
                            style: { cursor: "pointer" }
                          }, null, 8, Y_),
                          b("div", X_, [
                            b("a", {
                              href: E(D)(O.file_url),
                              target: "_blank",
                              class: "attachment-link"
                            }, [
                              p[40] || (p[40] = b("svg", {
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
                              dn(" " + ne(O.filename) + " ", 1),
                              b("span", J_, "(" + ne(E(C)(O.file_size)) + ")", 1)
                            ], 8, Z_)
                          ])
                        ])) : (x(), T("a", {
                          key: 1,
                          href: E(D)(O.file_url),
                          target: "_blank",
                          class: "attachment-link"
                        }, [
                          p[41] || (p[41] = b("svg", {
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
                          dn(" " + ne(O.filename) + " ", 1),
                          b("span", ey, "(" + ne(E(C)(O.file_size)) + ")", 1)
                        ], 8, Q_))
                      ]))), 128))
                    ])) : re("", !0)
                  ], 64))
                ], 4),
                ni.value && (u.message_type === "bot" || u.message_type === "agent") && u.sources && u.sources.length ? (x(), T("div", ty, [
                  p[42] || (p[42] = b("span", { class: "citation-label" }, "Sources", -1)),
                  (x(!0), T(Be, null, vt(u.sources, (O, Zt) => (x(), T("span", {
                    key: Zt,
                    class: "citation-chip",
                    title: Do(O)
                  }, ne(sr(O)), 9, ny))), 128))
                ])) : re("", !0),
                b("div", sy, [
                  u.message_type === "user" ? (x(), T("span", iy, " You ")) : re("", !0)
                ])
              ])
            ], 2);
          }), 128)),
          E(h) ? (x(), T("div", {
            key: 1,
            class: Ke(["typing-indicator", { "reading-indicator": ni.value }])
          }, [
            ni.value ? (x(), T(Be, { key: 0 }, [
              p[43] || (p[43] = b("div", {
                class: "reading-bars",
                "aria-hidden": "true"
              }, [
                b("span"),
                b("span"),
                b("span")
              ], -1)),
              p[44] || (p[44] = b("span", { class: "reading-label" }, "reading knowledge base", -1))
            ], 64)) : (x(), T("div", {
              key: 1,
              class: "cm-typing-bubble",
              style: Te(E(Y))
            }, p[45] || (p[45] = [
              b("span", { class: "cm-typing-dot" }, null, -1),
              b("span", { class: "cm-typing-dot" }, null, -1),
              b("span", { class: "cm-typing-dot" }, null, -1)
            ]), 4))
          ], 2)) : re("", !0)
        ], 512), [
          [fh, !Zn.value]
        ]),
        nu.value ? (x(), T("div", ry, [
          (x(!0), T(Be, null, vt(tr.value, (u) => (x(), T("button", {
            key: u,
            type: "button",
            class: "cm-quick-action",
            disabled: !$t.value,
            onClick: (te) => fs(u)
          }, ne(u), 9, oy))), 128))
        ])) : re("", !0),
        !ht.value && !Zn.value ? (x(), T("div", {
          key: 5,
          class: Ke(["chat-input", { "ask-anything-input": Ht.value }])
        }, [
          b("input", {
            ref_key: "fileInputRef",
            ref: Ue,
            type: "file",
            accept: Oy,
            multiple: "",
            style: { display: "none" },
            onChange: p[7] || (p[7] = //@ts-ignore
            (...u) => E(se) && E(se)(...u))
          }, null, 544),
          E(st).length > 0 ? (x(), T("div", ay, [
            (x(!0), T(Be, null, vt(E(st), (u, te) => (x(), T("div", {
              key: te,
              class: "file-preview-widget"
            }, [
              b("div", ly, [
                E(Xs)(u.type) ? (x(), T("img", {
                  key: 0,
                  src: E(X)(u),
                  alt: u.filename,
                  class: "file-preview-image-widget",
                  onClick: qn((we) => E(_t)(u), ["stop"]),
                  style: { cursor: "pointer" }
                }, null, 8, cy)) : (x(), T("div", {
                  key: 1,
                  class: "file-preview-icon-widget",
                  onClick: qn((we) => E(_t)(u), ["stop"]),
                  style: { cursor: "pointer" }
                }, p[46] || (p[46] = [
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
                ]), 8, uy))
              ]),
              b("div", fy, [
                b("div", hy, ne(u.filename), 1),
                b("div", dy, ne(E(C)(u.size)), 1)
              ]),
              b("button", {
                type: "button",
                class: "file-preview-remove-widget",
                onClick: (we) => E(gt)(te),
                title: "Remove file"
              }, " × ", 8, py)
            ]))), 128))
          ])) : re("", !0),
          Io.value ? (x(), T("div", gy, p[47] || (p[47] = [
            b("div", { class: "upload-spinner-widget" }, null, -1),
            b("span", { class: "upload-text-widget" }, "Uploading files...", -1)
          ]))) : re("", !0),
          b("div", my, [
            An(b("input", {
              "onUpdate:modelValue": p[8] || (p[8] = (u) => ee.value = u),
              type: "text",
              placeholder: Mn.value,
              onKeypress: Mt,
              onInput: Ye,
              onChange: Ye,
              onPaste: p[9] || (p[9] = //@ts-ignore
              (...u) => E(De) && E(De)(...u)),
              onDrop: p[10] || (p[10] = //@ts-ignore
              (...u) => E(ke) && E(ke)(...u)),
              onDragover: p[11] || (p[11] = //@ts-ignore
              (...u) => E(Se) && E(Se)(...u)),
              onDragleave: p[12] || (p[12] = //@ts-ignore
              (...u) => E(Ze) && E(Ze)(...u)),
              disabled: !$t.value,
              class: Ke({ disabled: !$t.value, "ask-anything-field": Ht.value })
            }, null, 42, _y), [
              [zn, ee.value]
            ]),
            Kc.value ? (x(), T("button", {
              key: 0,
              type: "button",
              class: "attach-button",
              disabled: Io.value,
              onClick: p[13] || (p[13] = //@ts-ignore
              (...u) => E(Yt) && E(Yt)(...u)),
              title: `Attach files (${E(st).length}/${tl} used) or paste screenshots`
            }, p[48] || (p[48] = [
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
            ]), 8, yy)) : re("", !0),
            b("button", {
              class: Ke(["send-button", { "ask-anything-send": Ht.value }]),
              style: Te(E(Q)),
              onClick: tn,
              disabled: !ee.value.trim() && E(st).length === 0 || !$t.value
            }, p[49] || (p[49] = [
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
            ]), 14, vy)
          ])
        ], 2)) : ht.value && !Zn.value ? (x(), T("div", by, [
          b("div", wy, [
            p[50] || (p[50] = b("p", { class: "ended-text" }, "This chat has ended.", -1)),
            b("button", {
              class: "start-new-conversation-button",
              style: Te(E(Q)),
              onClick: Zc
            }, " Click here to start a new conversation ", 4)
          ])
        ])) : re("", !0),
        Fo.value ? (x(), T("div", {
          key: 7,
          class: "ai-disclaimer",
          style: Te(E(ie))
        }, ne(E(Wa)), 5)) : re("", !0),
        b("div", {
          class: "powered-by",
          style: Te(E(ie))
        }, p[51] || (p[51] = [
          Un('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-de1b0657><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-de1b0657></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-de1b0657></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-de1b0657><span class="cm-powered-prefix" data-v-de1b0657>Powered by </span><strong class="cm-brand" data-v-de1b0657>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 6)) : re("", !0),
      zt.value ? (x(), T("div", ky, [
        b("div", xy, [
          p[52] || (p[52] = b("h3", null, "Rate your conversation", -1)),
          b("div", Ay, [
            (x(), T(Be, null, vt(5, (u) => b("button", {
              key: u,
              onClick: (te) => Fn.value = u,
              class: Ke([{ active: u <= Fn.value }, "star-button"])
            }, " ★ ", 10, Ty)), 64))
          ]),
          An(b("textarea", {
            "onUpdate:modelValue": p[14] || (p[14] = (u) => Yn.value = u),
            placeholder: "Additional feedback (optional)",
            class: "rating-feedback"
          }, null, 512), [
            [zn, Yn.value]
          ]),
          b("div", Sy, [
            b("button", {
              onClick: p[15] || (p[15] = (u) => d.submitRating(Fn.value, Yn.value)),
              disabled: !Fn.value,
              class: "submit-button",
              style: Te(E(Q))
            }, " Submit ", 12, Ey),
            b("button", {
              onClick: p[16] || (p[16] = (u) => zt.value = !1),
              class: "skip-rating"
            }, " Skip ")
          ])
        ])
      ])) : re("", !0),
      E(f) ? (x(), T("div", {
        key: 9,
        class: "preview-modal-overlay",
        onClick: p[19] || (p[19] = //@ts-ignore
        (...u) => E(ze) && E(ze)(...u))
      }, [
        b("div", {
          class: "preview-modal-content",
          onClick: p[18] || (p[18] = qn(() => {
          }, ["stop"]))
        }, [
          b("button", {
            class: "preview-modal-close",
            onClick: p[17] || (p[17] = //@ts-ignore
            (...u) => E(ze) && E(ze)(...u))
          }, "×"),
          E(v) && E(Xs)(E(v).type) ? (x(), T("div", Cy, [
            b("img", {
              src: E(X)(E(v)),
              alt: E(v).filename,
              class: "preview-modal-image"
            }, null, 8, Ry),
            b("div", Iy, ne(E(v).filename), 1)
          ])) : re("", !0)
        ])
      ])) : re("", !0)
    ], 6)) : (x(), T("div", Ly));
  }
}), My = /* @__PURE__ */ xc(Py, [["__scopeId", "data-v-de1b0657"]]);
window.process || (window.process = { env: { NODE_ENV: "production" } });
const Wt = window.__INITIAL_DATA__, Bc = new URL(window.location.href), $c = Bc.searchParams.get("preview") === "true", Uc = (e) => {
  const t = Bc.searchParams.get(e);
  if (!(!t || t === "undefined" || t.trim() === ""))
    return t;
}, Ny = $c ? Uc("widget_id") || (Wt == null ? void 0 : Wt.widgetId) || void 0 : (Wt == null ? void 0 : Wt.widgetId) || void 0, Fy = $c ? (Wt == null ? void 0 : Wt.initialToken) || Uc("token") || void 0 : (Wt == null ? void 0 : Wt.initialToken) || void 0, Dy = Lh(My, {
  widgetId: Ny,
  token: Fy || void 0,
  initialAuthError: null
  // Let backend determine if auth is required
});
Dy.mount("#app");

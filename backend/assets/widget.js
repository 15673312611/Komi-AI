var uu = Object.defineProperty;
var fu = (e, t, n) => t in e ? uu(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Ze = (e, t, n) => fu(e, typeof t != "symbol" ? t + "" : t, n);
/**
* @vue/shared v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function Xr(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const Qe = {}, ns = [], an = () => {
}, hu = () => !1, Fi = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), Zr = (e) => e.startsWith("onUpdate:"), xt = Object.assign, Jr = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, du = Object.prototype.hasOwnProperty, qe = (e, t) => du.call(e, t), me = Array.isArray, ss = (e) => Di(e) === "[object Map]", nl = (e) => Di(e) === "[object Set]", ve = (e) => typeof e == "function", pt = (e) => typeof e == "string", On = (e) => typeof e == "symbol", at = (e) => e !== null && typeof e == "object", sl = (e) => (at(e) || ve(e)) && ve(e.then) && ve(e.catch), il = Object.prototype.toString, Di = (e) => il.call(e), pu = (e) => Di(e).slice(8, -1), rl = (e) => Di(e) === "[object Object]", Qr = (e) => pt(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Os = /* @__PURE__ */ Xr(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Bi = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return (n) => t[n] || (t[n] = e(n));
}, gu = /-(\w)/g, Rn = Bi(
  (e) => e.replace(gu, (t, n) => n ? n.toUpperCase() : "")
), mu = /\B([A-Z])/g, Pn = Bi(
  (e) => e.replace(mu, "-$1").toLowerCase()
), ol = Bi((e) => e.charAt(0).toUpperCase() + e.slice(1)), ar = Bi(
  (e) => e ? `on${ol(e)}` : ""
), En = (e, t) => !Object.is(e, t), fi = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, Er = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, Cr = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
};
let ta;
const $i = () => ta || (ta = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Te(e) {
  if (me(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], i = pt(s) ? bu(s) : Te(s);
      if (i)
        for (const r in i)
          t[r] = i[r];
    }
    return t;
  } else if (pt(e) || at(e))
    return e;
}
const _u = /;(?![^(]*\))/g, yu = /:([^]+)/, vu = /\/\*[^]*?\*\//g;
function bu(e) {
  const t = {};
  return e.replace(vu, "").split(_u).forEach((n) => {
    if (n) {
      const s = n.split(yu);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function Je(e) {
  let t = "";
  if (pt(e))
    t = e;
  else if (me(e))
    for (let n = 0; n < e.length; n++) {
      const s = Je(e[n]);
      s && (t += s + " ");
    }
  else if (at(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const wu = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", ku = /* @__PURE__ */ Xr(wu);
function al(e) {
  return !!e || e === "";
}
const ll = (e) => !!(e && e.__v_isRef === !0), se = (e) => pt(e) ? e : e == null ? "" : me(e) || at(e) && (e.toString === il || !ve(e.toString)) ? ll(e) ? se(e.value) : JSON.stringify(e, cl, 2) : String(e), cl = (e, t) => ll(t) ? cl(e, t.value) : ss(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, i], r) => (n[lr(s, r) + " =>"] = i, n),
    {}
  )
} : nl(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => lr(n))
} : On(t) ? lr(t) : at(t) && !me(t) && !rl(t) ? String(t) : t, lr = (e, t = "") => {
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
class xu {
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
function Au() {
  return Pt;
}
let st;
const cr = /* @__PURE__ */ new WeakSet();
class ul {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, Pt && Pt.active && Pt.effects.push(this);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, cr.has(this) && (cr.delete(this), this.trigger()));
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
    const t = st, n = en;
    st = this, en = !0;
    try {
      return this.fn();
    } finally {
      pl(this), st = t, en = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        no(t);
      this.deps = this.depsTail = void 0, na(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? cr.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    Rr(this) && this.run();
  }
  get dirty() {
    return Rr(this);
  }
}
let fl = 0, Ps, Ns;
function hl(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = Ns, Ns = e;
    return;
  }
  e.next = Ps, Ps = e;
}
function eo() {
  fl++;
}
function to() {
  if (--fl > 0)
    return;
  if (Ns) {
    let t = Ns;
    for (Ns = void 0; t; ) {
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
    s.version === -1 ? (s === n && (n = i), no(s), Tu(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = i;
  }
  e.deps = t, e.depsTail = n;
}
function Rr(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (gl(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function gl(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Us) || (e.globalVersion = Us, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Rr(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = st, s = en;
  st = e, en = !0;
  try {
    dl(e);
    const i = e.fn(e._value);
    (t.version === 0 || En(i, e._value)) && (e.flags |= 128, e._value = i, t.version++);
  } catch (i) {
    throw t.version++, i;
  } finally {
    st = n, en = s, pl(e), e.flags &= -3;
  }
}
function no(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: i } = e;
  if (s && (s.nextSub = i, e.prevSub = void 0), i && (i.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let r = n.computed.deps; r; r = r.nextDep)
      no(r, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Tu(e) {
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
    const n = st;
    st = void 0;
    try {
      t();
    } finally {
      st = n;
    }
  }
}
let Us = 0;
class Su {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class so {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!st || !en || st === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== st)
      n = this.activeLink = new Su(st, this), st.deps ? (n.prevDep = st.depsTail, st.depsTail.nextDep = n, st.depsTail = n) : st.deps = st.depsTail = n, _l(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = st.depsTail, n.nextDep = void 0, st.depsTail.nextDep = n, st.depsTail = n, st.deps === n && (st.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, Us++, this.notify(t);
  }
  notify(t) {
    eo();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      to();
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
const Ir = /* @__PURE__ */ new WeakMap(), Wn = Symbol(
  ""
), Lr = Symbol(
  ""
), zs = Symbol(
  ""
);
function wt(e, t, n) {
  if (en && st) {
    let s = Ir.get(e);
    s || Ir.set(e, s = /* @__PURE__ */ new Map());
    let i = s.get(n);
    i || (s.set(n, i = new so()), i.map = s, i.key = n), i.track();
  }
}
function mn(e, t, n, s, i, r) {
  const o = Ir.get(e);
  if (!o) {
    Us++;
    return;
  }
  const a = (l) => {
    l && l.trigger();
  };
  if (eo(), t === "clear")
    o.forEach(a);
  else {
    const l = me(e), h = l && Qr(n);
    if (l && n === "length") {
      const c = Number(s);
      o.forEach((w, _) => {
        (_ === "length" || _ === zs || !On(_) && _ >= c) && a(w);
      });
    } else
      switch ((n !== void 0 || o.has(void 0)) && a(o.get(n)), h && a(o.get(zs)), t) {
        case "add":
          l ? h && a(o.get("length")) : (a(o.get(Wn)), ss(e) && a(o.get(Lr)));
          break;
        case "delete":
          l || (a(o.get(Wn)), ss(e) && a(o.get(Lr)));
          break;
        case "set":
          ss(e) && a(o.get(Wn));
          break;
      }
  }
  to();
}
function Qn(e) {
  const t = He(e);
  return t === e ? t : (wt(t, "iterate", zs), Vt(e) ? t : t.map(bt));
}
function Ui(e) {
  return wt(e = He(e), "iterate", zs), e;
}
const Eu = {
  __proto__: null,
  [Symbol.iterator]() {
    return ur(this, Symbol.iterator, bt);
  },
  concat(...e) {
    return Qn(this).concat(
      ...e.map((t) => me(t) ? Qn(t) : t)
    );
  },
  entries() {
    return ur(this, "entries", (e) => (e[1] = bt(e[1]), e));
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
    return fr(this, "includes", e);
  },
  indexOf(...e) {
    return fr(this, "indexOf", e);
  },
  join(e) {
    return Qn(this).join(e);
  },
  // keys() iterator only reads `length`, no optimisation required
  lastIndexOf(...e) {
    return fr(this, "lastIndexOf", e);
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
    return ur(this, "values", bt);
  }
};
function ur(e, t, n) {
  const s = Ui(e), i = s[t]();
  return s !== e && !Vt(e) && (i._next = i.next, i.next = () => {
    const r = i._next();
    return r.value && (r.value = n(r.value)), r;
  }), i;
}
const Cu = Array.prototype;
function hn(e, t, n, s, i, r) {
  const o = Ui(e), a = o !== e && !Vt(e), l = o[t];
  if (l !== Cu[t]) {
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
  const i = Ui(e);
  let r = n;
  return i !== e && (Vt(e) ? n.length > 3 && (r = function(o, a, l) {
    return n.call(this, o, a, l, e);
  }) : r = function(o, a, l) {
    return n.call(this, o, bt(a), l, e);
  }), i[t](r, ...s);
}
function fr(e, t, n) {
  const s = He(e);
  wt(s, "iterate", zs);
  const i = s[t](...n);
  return (i === -1 || i === !1) && oo(n[0]) ? (n[0] = He(n[0]), s[t](...n)) : i;
}
function ms(e, t, n = []) {
  bn(), eo();
  const s = He(e)[t].apply(e, n);
  return to(), wn(), s;
}
const Ru = /* @__PURE__ */ Xr("__proto__,__v_isRef,__isVue"), yl = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(On)
);
function Iu(e) {
  On(e) || (e = String(e));
  const t = He(this);
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
      return s === (i ? r ? Uu : xl : r ? kl : wl).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const o = me(t);
    if (!i) {
      let l;
      if (o && (l = Eu[n]))
        return l;
      if (n === "hasOwnProperty")
        return Iu;
    }
    const a = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      kt(t) ? t : s
    );
    return (On(n) ? yl.has(n) : Ru(n)) || (i || wt(t, "get", n), r) ? a : kt(a) ? o && Qr(n) ? a : a.value : at(a) ? i ? Al(a) : zi(a) : a;
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
      if (!Vt(s) && !In(s) && (r = He(r), s = He(s)), !me(t) && kt(r) && !kt(s))
        return l ? !1 : (r.value = s, !0);
    }
    const o = me(t) && Qr(n) ? Number(n) < t.length : qe(t, n), a = Reflect.set(
      t,
      n,
      s,
      kt(t) ? t : i
    );
    return t === He(i) && (o ? En(s, r) && mn(t, "set", n, s) : mn(t, "add", n, s)), a;
  }
  deleteProperty(t, n) {
    const s = qe(t, n);
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
      me(t) ? "length" : Wn
    ), Reflect.ownKeys(t);
  }
}
class Lu extends vl {
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
const Ou = /* @__PURE__ */ new bl(), Pu = /* @__PURE__ */ new Lu(), Nu = /* @__PURE__ */ new bl(!0);
const Or = (e) => e, si = (e) => Reflect.getPrototypeOf(e);
function Mu(e, t, n) {
  return function(...s) {
    const i = this.__v_raw, r = He(i), o = ss(r), a = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, h = i[e](...s), c = n ? Or : t ? Ti : bt;
    return !t && wt(
      r,
      "iterate",
      l ? Lr : Wn
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
function ii(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function Fu(e, t) {
  const n = {
    get(i) {
      const r = this.__v_raw, o = He(r), a = He(i);
      e || (En(i, a) && wt(o, "get", i), wt(o, "get", a));
      const { has: l } = si(o), h = t ? Or : e ? Ti : bt;
      if (l.call(o, i))
        return h(r.get(i));
      if (l.call(o, a))
        return h(r.get(a));
      r !== o && r.get(i);
    },
    get size() {
      const i = this.__v_raw;
      return !e && wt(He(i), "iterate", Wn), Reflect.get(i, "size", i);
    },
    has(i) {
      const r = this.__v_raw, o = He(r), a = He(i);
      return e || (En(i, a) && wt(o, "has", i), wt(o, "has", a)), i === a ? r.has(i) : r.has(i) || r.has(a);
    },
    forEach(i, r) {
      const o = this, a = o.__v_raw, l = He(a), h = t ? Or : e ? Ti : bt;
      return !e && wt(l, "iterate", Wn), a.forEach((c, w) => i.call(r, h(c), h(w), o));
    }
  };
  return xt(
    n,
    e ? {
      add: ii("add"),
      set: ii("set"),
      delete: ii("delete"),
      clear: ii("clear")
    } : {
      add(i) {
        !t && !Vt(i) && !In(i) && (i = He(i));
        const r = He(this);
        return si(r).has.call(r, i) || (r.add(i), mn(r, "add", i, i)), this;
      },
      set(i, r) {
        !t && !Vt(r) && !In(r) && (r = He(r));
        const o = He(this), { has: a, get: l } = si(o);
        let h = a.call(o, i);
        h || (i = He(i), h = a.call(o, i));
        const c = l.call(o, i);
        return o.set(i, r), h ? En(r, c) && mn(o, "set", i, r) : mn(o, "add", i, r), this;
      },
      delete(i) {
        const r = He(this), { has: o, get: a } = si(r);
        let l = o.call(r, i);
        l || (i = He(i), l = o.call(r, i)), a && a.call(r, i);
        const h = r.delete(i);
        return l && mn(r, "delete", i, void 0), h;
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
    n[i] = Mu(i, e, t);
  }), n;
}
function io(e, t) {
  const n = Fu(e, t);
  return (s, i, r) => i === "__v_isReactive" ? !e : i === "__v_isReadonly" ? e : i === "__v_raw" ? s : Reflect.get(
    qe(n, i) && i in s ? n : s,
    i,
    r
  );
}
const Du = {
  get: /* @__PURE__ */ io(!1, !1)
}, Bu = {
  get: /* @__PURE__ */ io(!1, !0)
}, $u = {
  get: /* @__PURE__ */ io(!0, !1)
};
const wl = /* @__PURE__ */ new WeakMap(), kl = /* @__PURE__ */ new WeakMap(), xl = /* @__PURE__ */ new WeakMap(), Uu = /* @__PURE__ */ new WeakMap();
function zu(e) {
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
function Hu(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : zu(pu(e));
}
function zi(e) {
  return In(e) ? e : ro(
    e,
    !1,
    Ou,
    Du,
    wl
  );
}
function qu(e) {
  return ro(
    e,
    !1,
    Nu,
    Bu,
    kl
  );
}
function Al(e) {
  return ro(
    e,
    !0,
    Pu,
    $u,
    xl
  );
}
function ro(e, t, n, s, i) {
  if (!at(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const r = Hu(e);
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
function Vt(e) {
  return !!(e && e.__v_isShallow);
}
function oo(e) {
  return e ? !!e.__v_raw : !1;
}
function He(e) {
  const t = e && e.__v_raw;
  return t ? He(t) : e;
}
function Wu(e) {
  return !qe(e, "__v_skip") && Object.isExtensible(e) && Er(e, "__v_skip", !0), e;
}
const bt = (e) => at(e) ? zi(e) : e, Ti = (e) => at(e) ? Al(e) : e;
function kt(e) {
  return e ? e.__v_isRef === !0 : !1;
}
function ue(e) {
  return ju(e, !1);
}
function ju(e, t) {
  return kt(e) ? e : new Vu(e, t);
}
class Vu {
  constructor(t, n) {
    this.dep = new so(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : He(t), this._value = n ? t : bt(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || Vt(t) || In(t);
    t = s ? t : He(t), En(t, n) && (this._rawValue = t, this._value = s ? t : bt(t), this.dep.trigger());
  }
}
function S(e) {
  return kt(e) ? e.value : e;
}
const Ku = {
  get: (e, t, n) => t === "__v_raw" ? e : S(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const i = e[t];
    return kt(i) && !kt(n) ? (i.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function Tl(e) {
  return is(e) ? e : new Proxy(e, Ku);
}
class Gu {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new so(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Us - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    st !== this)
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
function Yu(e, t, n = !1) {
  let s, i;
  return ve(e) ? s = e : (s = e.get, i = e.set), new Gu(s, i, n);
}
const ri = {}, Si = /* @__PURE__ */ new WeakMap();
let Hn;
function Xu(e, t = !1, n = Hn) {
  if (n) {
    let s = Si.get(n);
    s || Si.set(n, s = []), s.push(e);
  }
}
function Zu(e, t, n = Qe) {
  const { immediate: s, deep: i, once: r, scheduler: o, augmentJob: a, call: l } = n, h = (B) => i ? B : Vt(B) || i === !1 || i === 0 ? _n(B, 1) : _n(B);
  let c, w, _, O, P = !1, V = !1;
  if (kt(e) ? (w = () => e.value, P = Vt(e)) : is(e) ? (w = () => h(e), P = !0) : me(e) ? (V = !0, P = e.some((B) => is(B) || Vt(B)), w = () => e.map((B) => {
    if (kt(B))
      return B.value;
    if (is(B))
      return h(B);
    if (ve(B))
      return l ? l(B, 2) : B();
  })) : ve(e) ? t ? w = l ? () => l(e, 2) : e : w = () => {
    if (_) {
      bn();
      try {
        _();
      } finally {
        wn();
      }
    }
    const B = Hn;
    Hn = c;
    try {
      return l ? l(e, 3, [O]) : e(O);
    } finally {
      Hn = B;
    }
  } : w = an, t && i) {
    const B = w, q = i === !0 ? 1 / 0 : i;
    w = () => _n(B(), q);
  }
  const W = Au(), K = () => {
    c.stop(), W && W.active && Jr(W.effects, c);
  };
  if (r && t) {
    const B = t;
    t = (...q) => {
      B(...q), K();
    };
  }
  let le = V ? new Array(e.length).fill(ri) : ri;
  const be = (B) => {
    if (!(!(c.flags & 1) || !c.dirty && !B))
      if (t) {
        const q = c.run();
        if (i || P || (V ? q.some((oe, ee) => En(oe, le[ee])) : En(q, le))) {
          _ && _();
          const oe = Hn;
          Hn = c;
          try {
            const ee = [
              q,
              // pass undefined as the old value when it's changed for the first time
              le === ri ? void 0 : V && le[0] === ri ? [] : le,
              O
            ];
            le = q, l ? l(t, 3, ee) : (
              // @ts-expect-error
              t(...ee)
            );
          } finally {
            Hn = oe;
          }
        }
      } else
        c.run();
  };
  return a && a(be), c = new ul(w), c.scheduler = o ? () => o(be, !1) : be, O = (B) => Xu(B, !1, c), _ = c.onStop = () => {
    const B = Si.get(c);
    if (B) {
      if (l)
        l(B, 4);
      else
        for (const q of B) q();
      Si.delete(c);
    }
  }, t ? s ? be(!0) : le = c.run() : o ? o(be.bind(null, !0), !0) : c.run(), K.pause = c.pause.bind(c), K.resume = c.resume.bind(c), K.stop = K, K;
}
function _n(e, t = 1 / 0, n) {
  if (t <= 0 || !at(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Set(), n.has(e)))
    return e;
  if (n.add(e), t--, kt(e))
    _n(e.value, t, n);
  else if (me(e))
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
    Hi(i, t, n);
  }
}
function un(e, t, n, s) {
  if (ve(e)) {
    const i = Vs(e, t, n, s);
    return i && sl(i) && i.catch((r) => {
      Hi(r, t, n);
    }), i;
  }
  if (me(e)) {
    const i = [];
    for (let r = 0; r < e.length; r++)
      i.push(un(e[r], t, n, s));
    return i;
  }
}
function Hi(e, t, n, s = !0) {
  const i = t ? t.vnode : null, { errorHandler: r, throwUnhandledErrorInProduction: o } = t && t.appContext.config || Qe;
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
  Ju(e, n, i, s, o);
}
function Ju(e, t, n, s = !0, i = !1) {
  if (i)
    throw e;
  console.error(e);
}
const Et = [];
let rn = -1;
const rs = [];
let Tn = null, es = 0;
const Sl = /* @__PURE__ */ Promise.resolve();
let Ei = null;
function os(e) {
  const t = Ei || Sl;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function Qu(e) {
  let t = rn + 1, n = Et.length;
  for (; t < n; ) {
    const s = t + n >>> 1, i = Et[s], r = Hs(i);
    r < e || r === e && i.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function ao(e) {
  if (!(e.flags & 1)) {
    const t = Hs(e), n = Et[Et.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= Hs(n) ? Et.push(e) : Et.splice(Qu(t), 0, e), e.flags |= 1, El();
  }
}
function El() {
  Ei || (Ei = Sl.then(Rl));
}
function ef(e) {
  me(e) ? rs.push(...e) : Tn && e.id === -1 ? Tn.splice(es + 1, 0, e) : e.flags & 1 || (rs.push(e), e.flags |= 1), El();
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
    rn = -1, Et.length = 0, Cl(), Ei = null, (Et.length || rs.length) && Rl();
  }
}
let jt = null, Il = null;
function Ci(e) {
  const t = jt;
  return jt = e, Il = e && e.type.__scopeId || null, t;
}
function tf(e, t = jt, n) {
  if (!t || e._n)
    return e;
  const s = (...i) => {
    s._d && da(-1);
    const r = Ci(t);
    let o;
    try {
      o = e(...i);
    } finally {
      Ci(r), s._d && da(1);
    }
    return o;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function An(e, t) {
  if (jt === null)
    return e;
  const n = Ki(jt), s = e.dirs || (e.dirs = []);
  for (let i = 0; i < t.length; i++) {
    let [r, o, a, l = Qe] = t[i];
    r && (ve(r) && (r = {
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
const nf = Symbol("_vte"), sf = (e) => e.__isTeleport;
function lo(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, lo(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function Ll(e, t) {
  return ve(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    xt({ name: e.name }, t, { setup: e })
  ) : e;
}
function Ol(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function Ms(e, t, n, s, i = !1) {
  if (me(e)) {
    e.forEach(
      (P, V) => Ms(
        P,
        t && (me(t) ? t[V] : t),
        n,
        s,
        i
      )
    );
    return;
  }
  if (Fs(s) && !i) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Ms(e, t, n, s.component.subTree);
    return;
  }
  const r = s.shapeFlag & 4 ? Ki(s.component) : s.el, o = i ? null : r, { i: a, r: l } = e, h = t && t.r, c = a.refs === Qe ? a.refs = {} : a.refs, w = a.setupState, _ = He(w), O = w === Qe ? () => !1 : (P) => qe(_, P);
  if (h != null && h !== l && (pt(h) ? (c[h] = null, O(h) && (w[h] = null)) : kt(h) && (h.value = null)), ve(l))
    Vs(l, a, 12, [o, c]);
  else {
    const P = pt(l), V = kt(l);
    if (P || V) {
      const W = () => {
        if (e.f) {
          const K = P ? O(l) ? w[l] : c[l] : l.value;
          i ? me(K) && Jr(K, r) : me(K) ? K.includes(r) || K.push(r) : P ? (c[l] = [r], O(l) && (w[l] = c[l])) : (l.value = [r], e.k && (c[e.k] = l.value));
        } else P ? (c[l] = o, O(l) && (w[l] = o)) : V && (l.value = o, e.k && (c[e.k] = o));
      };
      o ? (W.id = -1, Dt(W, n)) : W();
    }
  }
}
$i().requestIdleCallback;
$i().cancelIdleCallback;
const Fs = (e) => !!e.type.__asyncLoader, Pl = (e) => e.type.__isKeepAlive;
function rf(e, t) {
  Nl(e, "a", t);
}
function of(e, t) {
  Nl(e, "da", t);
}
function Nl(e, t, n = Ct) {
  const s = e.__wdc || (e.__wdc = () => {
    let i = n;
    for (; i; ) {
      if (i.isDeactivated)
        return;
      i = i.parent;
    }
    return e();
  });
  if (qi(t, s, n), n) {
    let i = n.parent;
    for (; i && i.parent; )
      Pl(i.parent.vnode) && af(s, t, n, i), i = i.parent;
  }
}
function af(e, t, n, s) {
  const i = qi(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  Ks(() => {
    Jr(s[t], i);
  }, n);
}
function qi(e, t, n = Ct, s = !1) {
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
  (!Ws || e === "sp") && qi(e, (...s) => t(...s), n);
}, lf = kn("bm"), Wi = kn("m"), cf = kn(
  "bu"
), uf = kn("u"), Ml = kn(
  "bum"
), Ks = kn("um"), ff = kn(
  "sp"
), hf = kn("rtg"), df = kn("rtc");
function pf(e, t = Ct) {
  qi("ec", e, t);
}
const gf = Symbol.for("v-ndc");
function vt(e, t, n, s) {
  let i;
  const r = n, o = me(e);
  if (o || pt(e)) {
    const a = o && is(e);
    let l = !1, h = !1;
    a && (l = !Vt(e), h = In(e), e = Ui(e)), i = new Array(e.length);
    for (let c = 0, w = e.length; c < w; c++)
      i[c] = t(
        l ? h ? Ti(bt(e[c])) : bt(e[c]) : e[c],
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
const Pr = (e) => e ? sc(e) ? Ki(e) : Pr(e.parent) : null, Ds = (
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
    $parent: (e) => Pr(e.parent),
    $root: (e) => Pr(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Dl(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      ao(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = os.bind(e.proxy)),
    $watch: (e) => Df.bind(e)
  })
), hr = (e, t) => e !== Qe && !e.__isScriptSetup && qe(e, t), mf = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: i, props: r, accessCache: o, type: a, appContext: l } = e;
    let h;
    if (t[0] !== "$") {
      const O = o[t];
      if (O !== void 0)
        switch (O) {
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
        if (hr(s, t))
          return o[t] = 1, s[t];
        if (i !== Qe && qe(i, t))
          return o[t] = 2, i[t];
        if (
          // only cache other properties when instance has declared (thus stable)
          // props
          (h = e.propsOptions[0]) && qe(h, t)
        )
          return o[t] = 3, r[t];
        if (n !== Qe && qe(n, t))
          return o[t] = 4, n[t];
        Nr && (o[t] = 0);
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
    if (n !== Qe && qe(n, t))
      return o[t] = 4, n[t];
    if (
      // global properties
      _ = l.config.globalProperties, qe(_, t)
    )
      return _[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: i, ctx: r } = e;
    return hr(i, t) ? (i[t] = n, !0) : s !== Qe && qe(s, t) ? (s[t] = n, !0) : qe(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (r[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: i, propsOptions: r }
  }, o) {
    let a;
    return !!n[o] || e !== Qe && qe(e, o) || hr(t, o) || (a = r[0]) && qe(a, o) || qe(s, o) || qe(Ds, o) || qe(i.config.globalProperties, o);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : qe(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function ra(e) {
  return me(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let Nr = !0;
function _f(e) {
  const t = Dl(e), n = e.proxy, s = e.ctx;
  Nr = !1, t.beforeCreate && oa(t.beforeCreate, e, "bc");
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
    beforeUpdate: O,
    updated: P,
    activated: V,
    deactivated: W,
    beforeDestroy: K,
    beforeUnmount: le,
    destroyed: be,
    unmounted: B,
    render: q,
    renderTracked: oe,
    renderTriggered: ee,
    errorCaptured: Ne,
    serverPrefetch: it,
    // public API
    expose: et,
    inheritAttrs: Ce,
    // assets
    components: we,
    directives: Ve,
    filters: tt
  } = t;
  if (h && yf(h, s, null), o)
    for (const _e in o) {
      const te = o[_e];
      ve(te) && (s[_e] = te.bind(n));
    }
  if (i) {
    const _e = i.call(n, n);
    at(_e) && (e.data = zi(_e));
  }
  if (Nr = !0, r)
    for (const _e in r) {
      const te = r[_e], ot = ve(te) ? te.bind(n, n) : ve(te.get) ? te.get.bind(n, n) : an, Re = !ve(te) && ve(te.set) ? te.set.bind(n) : an, ge = pe({
        get: ot,
        set: Re
      });
      Object.defineProperty(s, _e, {
        enumerable: !0,
        configurable: !0,
        get: () => ge.value,
        set: (Ke) => ge.value = Ke
      });
    }
  if (a)
    for (const _e in a)
      Fl(a[_e], s, n, _e);
  if (l) {
    const _e = ve(l) ? l.call(n) : l;
    Reflect.ownKeys(_e).forEach((te) => {
      Af(te, _e[te]);
    });
  }
  c && oa(c, e, "c");
  function fe(_e, te) {
    me(te) ? te.forEach((ot) => _e(ot.bind(n))) : te && _e(te.bind(n));
  }
  if (fe(lf, w), fe(Wi, _), fe(cf, O), fe(uf, P), fe(rf, V), fe(of, W), fe(pf, Ne), fe(df, oe), fe(hf, ee), fe(Ml, le), fe(Ks, B), fe(ff, it), me(et))
    if (et.length) {
      const _e = e.exposed || (e.exposed = {});
      et.forEach((te) => {
        Object.defineProperty(_e, te, {
          get: () => n[te],
          set: (ot) => n[te] = ot,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  q && e.render === an && (e.render = q), Ce != null && (e.inheritAttrs = Ce), we && (e.components = we), Ve && (e.directives = Ve), it && Ol(e);
}
function yf(e, t, n = an) {
  me(e) && (e = Mr(e));
  for (const s in e) {
    const i = e[s];
    let r;
    at(i) ? "default" in i ? r = hi(
      i.from || s,
      i.default,
      !0
    ) : r = hi(i.from || s) : r = hi(i), kt(r) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => r.value,
      set: (o) => r.value = o
    }) : t[s] = r;
  }
}
function oa(e, t, n) {
  un(
    me(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function Fl(e, t, n, s) {
  let i = s.includes(".") ? Xl(n, s) : () => n[s];
  if (pt(e)) {
    const r = t[e];
    ve(r) && Qt(i, r);
  } else if (ve(e))
    Qt(i, e.bind(n));
  else if (at(e))
    if (me(e))
      e.forEach((r) => Fl(r, t, n, s));
    else {
      const r = ve(e.handler) ? e.handler.bind(n) : t[e.handler];
      ve(r) && Qt(i, r, e);
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
    (h) => Ri(l, h, o, !0)
  ), Ri(l, t, o)), at(t) && r.set(t, l), l;
}
function Ri(e, t, n, s = !1) {
  const { mixins: i, extends: r } = t;
  r && Ri(e, r, n, !0), i && i.forEach(
    (o) => Ri(e, o, n, !0)
  );
  for (const o in t)
    if (!(s && o === "expose")) {
      const a = vf[o] || n && n[o];
      e[o] = a ? a(e[o], t[o]) : t[o];
    }
  return e;
}
const vf = {
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
  watch: wf,
  // provide / inject
  provide: aa,
  inject: bf
};
function aa(e, t) {
  return t ? e ? function() {
    return xt(
      ve(e) ? e.call(this, this) : e,
      ve(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function bf(e, t) {
  return Rs(Mr(e), Mr(t));
}
function Mr(e) {
  if (me(e)) {
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
  return e ? me(e) && me(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : xt(
    /* @__PURE__ */ Object.create(null),
    ra(e),
    ra(t ?? {})
  ) : t;
}
function wf(e, t) {
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
      isNativeTag: hu,
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
let kf = 0;
function xf(e, t) {
  return function(s, i = null) {
    ve(s) || (s = xt({}, s)), i != null && !at(i) && (i = null);
    const r = Bl(), o = /* @__PURE__ */ new WeakSet(), a = [];
    let l = !1;
    const h = r.app = {
      _uid: kf++,
      _component: s,
      _props: i,
      _container: null,
      _context: r,
      _instance: null,
      version: ih,
      get config() {
        return r.config;
      },
      set config(c) {
      },
      use(c, ...w) {
        return o.has(c) || (c && ve(c.install) ? (o.add(c), c.install(h, ...w)) : ve(c) && (o.add(c), c(h, ...w))), h;
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
          const O = h._ceVNode || ln(s, i);
          return O.appContext = r, _ === !0 ? _ = "svg" : _ === !1 && (_ = void 0), e(O, c, _), l = !0, h._container = c, c.__vue_app__ = h, Ki(O.component);
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
function Af(e, t) {
  if (Ct) {
    let n = Ct.provides;
    const s = Ct.parent && Ct.parent.provides;
    s === n && (n = Ct.provides = Object.create(s)), n[e] = t;
  }
}
function hi(e, t, n = !1) {
  const s = Jf();
  if (s || as) {
    let i = as ? as._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (i && e in i)
      return i[e];
    if (arguments.length > 1)
      return n && ve(t) ? t.call(s && s.proxy) : t;
  }
}
const $l = {}, Ul = () => Object.create($l), zl = (e) => Object.getPrototypeOf(e) === $l;
function Tf(e, t, n, s = !1) {
  const i = {}, r = Ul();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Hl(e, t, i, r);
  for (const o in e.propsOptions[0])
    o in i || (i[o] = void 0);
  n ? e.props = s ? i : qu(i) : e.type.props ? e.props = i : e.props = r, e.attrs = r;
}
function Sf(e, t, n, s) {
  const {
    props: i,
    attrs: r,
    vnode: { patchFlag: o }
  } = e, a = He(i), [l] = e.propsOptions;
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
        if (ji(e.emitsOptions, _))
          continue;
        const O = t[_];
        if (l)
          if (qe(r, _))
            O !== r[_] && (r[_] = O, h = !0);
          else {
            const P = Rn(_);
            i[P] = Fr(
              l,
              a,
              P,
              O,
              e,
              !1
            );
          }
        else
          O !== r[_] && (r[_] = O, h = !0);
      }
    }
  } else {
    Hl(e, t, i, r) && (h = !0);
    let c;
    for (const w in a)
      (!t || // for camelCase
      !qe(t, w) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((c = Pn(w)) === w || !qe(t, c))) && (l ? n && // for camelCase
      (n[w] !== void 0 || // for kebab-case
      n[c] !== void 0) && (i[w] = Fr(
        l,
        a,
        w,
        void 0,
        e,
        !0
      )) : delete i[w]);
    if (r !== a)
      for (const w in r)
        (!t || !qe(t, w)) && (delete r[w], h = !0);
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
      i && qe(i, c = Rn(l)) ? !r || !r.includes(c) ? n[c] = h : (a || (a = {}))[c] = h : ji(e.emitsOptions, l) || (!(l in s) || h !== s[l]) && (s[l] = h, o = !0);
    }
  if (r) {
    const l = He(n), h = a || Qe;
    for (let c = 0; c < r.length; c++) {
      const w = r[c];
      n[w] = Fr(
        i,
        l,
        w,
        h[w],
        e,
        !qe(h, w)
      );
    }
  }
  return o;
}
function Fr(e, t, n, s, i, r) {
  const o = e[n];
  if (o != null) {
    const a = qe(o, "default");
    if (a && s === void 0) {
      const l = o.default;
      if (o.type !== Function && !o.skipFactory && ve(l)) {
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
const Ef = /* @__PURE__ */ new WeakMap();
function ql(e, t, n = !1) {
  const s = n ? Ef : t.propsCache, i = s.get(e);
  if (i)
    return i;
  const r = e.props, o = {}, a = [];
  let l = !1;
  if (!ve(e)) {
    const c = (w) => {
      l = !0;
      const [_, O] = ql(w, t, !0);
      xt(o, _), O && a.push(...O);
    };
    !n && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  if (!r && !l)
    return at(e) && s.set(e, ns), ns;
  if (me(r))
    for (let c = 0; c < r.length; c++) {
      const w = Rn(r[c]);
      ca(w) && (o[w] = Qe);
    }
  else if (r)
    for (const c in r) {
      const w = Rn(c);
      if (ca(w)) {
        const _ = r[c], O = o[w] = me(_) || ve(_) ? { type: _ } : xt({}, _), P = O.type;
        let V = !1, W = !0;
        if (me(P))
          for (let K = 0; K < P.length; ++K) {
            const le = P[K], be = ve(le) && le.name;
            if (be === "Boolean") {
              V = !0;
              break;
            } else be === "String" && (W = !1);
          }
        else
          V = ve(P) && P.name === "Boolean";
        O[
          0
          /* shouldCast */
        ] = V, O[
          1
          /* shouldCastTrue */
        ] = W, (V || qe(O, "default")) && a.push(w);
      }
    }
  const h = [o, a];
  return at(e) && s.set(e, h), h;
}
function ca(e) {
  return e[0] !== "$" && !Os(e);
}
const co = (e) => e === "_" || e === "__" || e === "_ctx" || e === "$stable", uo = (e) => me(e) ? e.map(on) : [on(e)], Cf = (e, t, n) => {
  if (t._n)
    return t;
  const s = tf((...i) => uo(t(...i)), n);
  return s._c = !1, s;
}, Wl = (e, t, n) => {
  const s = e._ctx;
  for (const i in e) {
    if (co(i)) continue;
    const r = e[i];
    if (ve(r))
      t[i] = Cf(i, r, s);
    else if (r != null) {
      const o = uo(r);
      t[i] = () => o;
    }
  }
}, jl = (e, t) => {
  const n = uo(t);
  e.slots.default = () => n;
}, Vl = (e, t, n) => {
  for (const s in t)
    (n || !co(s)) && (e[s] = t[s]);
}, Rf = (e, t, n) => {
  const s = e.slots = Ul();
  if (e.vnode.shapeFlag & 32) {
    const i = t.__;
    i && Er(s, "__", i, !0);
    const r = t._;
    r ? (Vl(s, t, n), n && Er(s, "_", r, !0)) : Wl(t, s);
  } else t && jl(e, t);
}, If = (e, t, n) => {
  const { vnode: s, slots: i } = e;
  let r = !0, o = Qe;
  if (s.shapeFlag & 32) {
    const a = t._;
    a ? n && a === 1 ? r = !1 : Vl(i, t, n) : (r = !t.$stable, Wl(t, i)), o = t;
  } else t && (jl(e, t), o = { default: 1 });
  if (r)
    for (const a in i)
      !co(a) && o[a] == null && delete i[a];
}, Dt = Wf;
function Lf(e) {
  return Of(e);
}
function Of(e, t) {
  const n = $i();
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
    setScopeId: O = an,
    insertStaticContent: P
  } = e, V = (p, y, x, R = null, I = null, C = null, U = void 0, D = null, $ = !!y.dynamicChildren) => {
    if (p === y)
      return;
    p && !_s(p, y) && (R = Me(p), Ke(p, I, C, !0), p = null), y.patchFlag === -2 && ($ = !1, y.dynamicChildren = null);
    const { type: N, ref: J, shapeFlag: z } = y;
    switch (N) {
      case Vi:
        W(p, y, x, R);
        break;
      case Ln:
        K(p, y, x, R);
        break;
      case di:
        p == null && le(y, x, R, U);
        break;
      case De:
        we(
          p,
          y,
          x,
          R,
          I,
          C,
          U,
          D,
          $
        );
        break;
      default:
        z & 1 ? q(
          p,
          y,
          x,
          R,
          I,
          C,
          U,
          D,
          $
        ) : z & 6 ? Ve(
          p,
          y,
          x,
          R,
          I,
          C,
          U,
          D,
          $
        ) : (z & 64 || z & 128) && N.process(
          p,
          y,
          x,
          R,
          I,
          C,
          U,
          D,
          $,
          ct
        );
    }
    J != null && I ? Ms(J, p && p.ref, C, y || p, !y) : J == null && p && p.ref != null && Ms(p.ref, null, C, p, !0);
  }, W = (p, y, x, R) => {
    if (p == null)
      s(
        y.el = a(y.children),
        x,
        R
      );
    else {
      const I = y.el = p.el;
      y.children !== p.children && h(I, y.children);
    }
  }, K = (p, y, x, R) => {
    p == null ? s(
      y.el = l(y.children || ""),
      x,
      R
    ) : y.el = p.el;
  }, le = (p, y, x, R) => {
    [p.el, p.anchor] = P(
      p.children,
      y,
      x,
      R,
      p.el,
      p.anchor
    );
  }, be = ({ el: p, anchor: y }, x, R) => {
    let I;
    for (; p && p !== y; )
      I = _(p), s(p, x, R), p = I;
    s(y, x, R);
  }, B = ({ el: p, anchor: y }) => {
    let x;
    for (; p && p !== y; )
      x = _(p), i(p), p = x;
    i(y);
  }, q = (p, y, x, R, I, C, U, D, $) => {
    y.type === "svg" ? U = "svg" : y.type === "math" && (U = "mathml"), p == null ? oe(
      y,
      x,
      R,
      I,
      C,
      U,
      D,
      $
    ) : it(
      p,
      y,
      I,
      C,
      U,
      D,
      $
    );
  }, oe = (p, y, x, R, I, C, U, D) => {
    let $, N;
    const { props: J, shapeFlag: z, transition: Y, dirs: Q } = p;
    if ($ = p.el = o(
      p.type,
      C,
      J && J.is,
      J
    ), z & 8 ? c($, p.children) : z & 16 && Ne(
      p.children,
      $,
      null,
      R,
      I,
      dr(p, C),
      U,
      D
    ), Q && Bn(p, null, R, "created"), ee($, p, p.scopeId, U, R), J) {
      for (const Pe in J)
        Pe !== "value" && !Os(Pe) && r($, Pe, null, J[Pe], C, R);
      "value" in J && r($, "value", null, J.value, C), (N = J.onVnodeBeforeMount) && nn(N, R, p);
    }
    Q && Bn(p, null, R, "beforeMount");
    const re = Pf(I, Y);
    re && Y.beforeEnter($), s($, y, x), ((N = J && J.onVnodeMounted) || re || Q) && Dt(() => {
      N && nn(N, R, p), re && Y.enter($), Q && Bn(p, null, R, "mounted");
    }, I);
  }, ee = (p, y, x, R, I) => {
    if (x && O(p, x), R)
      for (let C = 0; C < R.length; C++)
        O(p, R[C]);
    if (I) {
      let C = I.subTree;
      if (y === C || Jl(C.type) && (C.ssContent === y || C.ssFallback === y)) {
        const U = I.vnode;
        ee(
          p,
          U,
          U.scopeId,
          U.slotScopeIds,
          I.parent
        );
      }
    }
  }, Ne = (p, y, x, R, I, C, U, D, $ = 0) => {
    for (let N = $; N < p.length; N++) {
      const J = p[N] = D ? Sn(p[N]) : on(p[N]);
      V(
        null,
        J,
        y,
        x,
        R,
        I,
        C,
        U,
        D
      );
    }
  }, it = (p, y, x, R, I, C, U) => {
    const D = y.el = p.el;
    let { patchFlag: $, dynamicChildren: N, dirs: J } = y;
    $ |= p.patchFlag & 16;
    const z = p.props || Qe, Y = y.props || Qe;
    let Q;
    if (x && $n(x, !1), (Q = Y.onVnodeBeforeUpdate) && nn(Q, x, y, p), J && Bn(y, p, x, "beforeUpdate"), x && $n(x, !0), (z.innerHTML && Y.innerHTML == null || z.textContent && Y.textContent == null) && c(D, ""), N ? et(
      p.dynamicChildren,
      N,
      D,
      x,
      R,
      dr(y, I),
      C
    ) : U || te(
      p,
      y,
      D,
      null,
      x,
      R,
      dr(y, I),
      C,
      !1
    ), $ > 0) {
      if ($ & 16)
        Ce(D, z, Y, x, I);
      else if ($ & 2 && z.class !== Y.class && r(D, "class", null, Y.class, I), $ & 4 && r(D, "style", z.style, Y.style, I), $ & 8) {
        const re = y.dynamicProps;
        for (let Pe = 0; Pe < re.length; Pe++) {
          const he = re[Pe], ut = z[he], $e = Y[he];
          ($e !== ut || he === "value") && r(D, he, ut, $e, I, x);
        }
      }
      $ & 1 && p.children !== y.children && c(D, y.children);
    } else !U && N == null && Ce(D, z, Y, x, I);
    ((Q = Y.onVnodeUpdated) || J) && Dt(() => {
      Q && nn(Q, x, y, p), J && Bn(y, p, x, "updated");
    }, R);
  }, et = (p, y, x, R, I, C, U) => {
    for (let D = 0; D < y.length; D++) {
      const $ = p[D], N = y[D], J = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        $.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        ($.type === De || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !_s($, N) || // - In the case of a component, it could contain anything.
        $.shapeFlag & 198) ? w($.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          x
        )
      );
      V(
        $,
        N,
        J,
        null,
        R,
        I,
        C,
        U,
        !0
      );
    }
  }, Ce = (p, y, x, R, I) => {
    if (y !== x) {
      if (y !== Qe)
        for (const C in y)
          !Os(C) && !(C in x) && r(
            p,
            C,
            y[C],
            null,
            I,
            R
          );
      for (const C in x) {
        if (Os(C)) continue;
        const U = x[C], D = y[C];
        U !== D && C !== "value" && r(p, C, D, U, I, R);
      }
      "value" in x && r(p, "value", y.value, x.value, I);
    }
  }, we = (p, y, x, R, I, C, U, D, $) => {
    const N = y.el = p ? p.el : a(""), J = y.anchor = p ? p.anchor : a("");
    let { patchFlag: z, dynamicChildren: Y, slotScopeIds: Q } = y;
    Q && (D = D ? D.concat(Q) : Q), p == null ? (s(N, x, R), s(J, x, R), Ne(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      y.children || [],
      x,
      J,
      I,
      C,
      U,
      D,
      $
    )) : z > 0 && z & 64 && Y && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    p.dynamicChildren ? (et(
      p.dynamicChildren,
      Y,
      x,
      I,
      C,
      U,
      D
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (y.key != null || I && y === I.subTree) && Kl(
      p,
      y,
      !0
      /* shallow */
    )) : te(
      p,
      y,
      x,
      J,
      I,
      C,
      U,
      D,
      $
    );
  }, Ve = (p, y, x, R, I, C, U, D, $) => {
    y.slotScopeIds = D, p == null ? y.shapeFlag & 512 ? I.ctx.activate(
      y,
      x,
      R,
      U,
      $
    ) : tt(
      y,
      x,
      R,
      I,
      C,
      U,
      $
    ) : lt(p, y, $);
  }, tt = (p, y, x, R, I, C, U) => {
    const D = p.component = Zf(
      p,
      R,
      I
    );
    if (Pl(p) && (D.ctx.renderer = ct), Qf(D, !1, U), D.asyncDep) {
      if (I && I.registerDep(D, fe, U), !p.el) {
        const $ = D.subTree = ln(Ln);
        K(null, $, y, x), p.placeholder = $.el;
      }
    } else
      fe(
        D,
        p,
        y,
        x,
        I,
        C,
        U
      );
  }, lt = (p, y, x) => {
    const R = y.component = p.component;
    if (Hf(p, y, x))
      if (R.asyncDep && !R.asyncResolved) {
        _e(R, y, x);
        return;
      } else
        R.next = y, R.update();
    else
      y.el = p.el, R.vnode = y;
  }, fe = (p, y, x, R, I, C, U) => {
    const D = () => {
      if (p.isMounted) {
        let { next: z, bu: Y, u: Q, parent: re, vnode: Pe } = p;
        {
          const f = Gl(p);
          if (f) {
            z && (z.el = Pe.el, _e(p, z, U)), f.asyncDep.then(() => {
              p.isUnmounted || D();
            });
            return;
          }
        }
        let he = z, ut;
        $n(p, !1), z ? (z.el = Pe.el, _e(p, z, U)) : z = Pe, Y && fi(Y), (ut = z.props && z.props.onVnodeBeforeUpdate) && nn(ut, re, z, Pe), $n(p, !0);
        const $e = fa(p), nt = p.subTree;
        p.subTree = $e, V(
          nt,
          $e,
          // parent may have changed if it's in a teleport
          w(nt.el),
          // anchor may have changed if it's in a fragment
          Me(nt),
          p,
          I,
          C
        ), z.el = $e.el, he === null && qf(p, $e.el), Q && Dt(Q, I), (ut = z.props && z.props.onVnodeUpdated) && Dt(
          () => nn(ut, re, z, Pe),
          I
        );
      } else {
        let z;
        const { el: Y, props: Q } = y, { bm: re, m: Pe, parent: he, root: ut, type: $e } = p, nt = Fs(y);
        $n(p, !1), re && fi(re), !nt && (z = Q && Q.onVnodeBeforeMount) && nn(z, he, y), $n(p, !0);
        {
          ut.ce && // @ts-expect-error _def is private
          ut.ce._def.shadowRoot !== !1 && ut.ce._injectChildStyle($e);
          const f = p.subTree = fa(p);
          V(
            null,
            f,
            x,
            R,
            p,
            I,
            C
          ), y.el = f.el;
        }
        if (Pe && Dt(Pe, I), !nt && (z = Q && Q.onVnodeMounted)) {
          const f = y;
          Dt(
            () => nn(z, he, f),
            I
          );
        }
        (y.shapeFlag & 256 || he && Fs(he.vnode) && he.vnode.shapeFlag & 256) && p.a && Dt(p.a, I), p.isMounted = !0, y = x = R = null;
      }
    };
    p.scope.on();
    const $ = p.effect = new ul(D);
    p.scope.off();
    const N = p.update = $.run.bind($), J = p.job = $.runIfDirty.bind($);
    J.i = p, J.id = p.uid, $.scheduler = () => ao(J), $n(p, !0), N();
  }, _e = (p, y, x) => {
    y.component = p;
    const R = p.vnode.props;
    p.vnode = y, p.next = null, Sf(p, y.props, R, x), If(p, y.children, x), bn(), ia(p), wn();
  }, te = (p, y, x, R, I, C, U, D, $ = !1) => {
    const N = p && p.children, J = p ? p.shapeFlag : 0, z = y.children, { patchFlag: Y, shapeFlag: Q } = y;
    if (Y > 0) {
      if (Y & 128) {
        Re(
          N,
          z,
          x,
          R,
          I,
          C,
          U,
          D,
          $
        );
        return;
      } else if (Y & 256) {
        ot(
          N,
          z,
          x,
          R,
          I,
          C,
          U,
          D,
          $
        );
        return;
      }
    }
    Q & 8 ? (J & 16 && ce(N, I, C), z !== N && c(x, z)) : J & 16 ? Q & 16 ? Re(
      N,
      z,
      x,
      R,
      I,
      C,
      U,
      D,
      $
    ) : ce(N, I, C, !0) : (J & 8 && c(x, ""), Q & 16 && Ne(
      z,
      x,
      R,
      I,
      C,
      U,
      D,
      $
    ));
  }, ot = (p, y, x, R, I, C, U, D, $) => {
    p = p || ns, y = y || ns;
    const N = p.length, J = y.length, z = Math.min(N, J);
    let Y;
    for (Y = 0; Y < z; Y++) {
      const Q = y[Y] = $ ? Sn(y[Y]) : on(y[Y]);
      V(
        p[Y],
        Q,
        x,
        null,
        I,
        C,
        U,
        D,
        $
      );
    }
    N > J ? ce(
      p,
      I,
      C,
      !0,
      !1,
      z
    ) : Ne(
      y,
      x,
      R,
      I,
      C,
      U,
      D,
      $,
      z
    );
  }, Re = (p, y, x, R, I, C, U, D, $) => {
    let N = 0;
    const J = y.length;
    let z = p.length - 1, Y = J - 1;
    for (; N <= z && N <= Y; ) {
      const Q = p[N], re = y[N] = $ ? Sn(y[N]) : on(y[N]);
      if (_s(Q, re))
        V(
          Q,
          re,
          x,
          null,
          I,
          C,
          U,
          D,
          $
        );
      else
        break;
      N++;
    }
    for (; N <= z && N <= Y; ) {
      const Q = p[z], re = y[Y] = $ ? Sn(y[Y]) : on(y[Y]);
      if (_s(Q, re))
        V(
          Q,
          re,
          x,
          null,
          I,
          C,
          U,
          D,
          $
        );
      else
        break;
      z--, Y--;
    }
    if (N > z) {
      if (N <= Y) {
        const Q = Y + 1, re = Q < J ? y[Q].el : R;
        for (; N <= Y; )
          V(
            null,
            y[N] = $ ? Sn(y[N]) : on(y[N]),
            x,
            re,
            I,
            C,
            U,
            D,
            $
          ), N++;
      }
    } else if (N > Y)
      for (; N <= z; )
        Ke(p[N], I, C, !0), N++;
    else {
      const Q = N, re = N, Pe = /* @__PURE__ */ new Map();
      for (N = re; N <= Y; N++) {
        const T = y[N] = $ ? Sn(y[N]) : on(y[N]);
        T.key != null && Pe.set(T.key, N);
      }
      let he, ut = 0;
      const $e = Y - re + 1;
      let nt = !1, f = 0;
      const v = new Array($e);
      for (N = 0; N < $e; N++) v[N] = 0;
      for (N = Q; N <= z; N++) {
        const T = p[N];
        if (ut >= $e) {
          Ke(T, I, C, !0);
          continue;
        }
        let M;
        if (T.key != null)
          M = Pe.get(T.key);
        else
          for (he = re; he <= Y; he++)
            if (v[he - re] === 0 && _s(T, y[he])) {
              M = he;
              break;
            }
        M === void 0 ? Ke(T, I, C, !0) : (v[M - re] = N + 1, M >= f ? f = M : nt = !0, V(
          T,
          y[M],
          x,
          null,
          I,
          C,
          U,
          D,
          $
        ), ut++);
      }
      const E = nt ? Nf(v) : ns;
      for (he = E.length - 1, N = $e - 1; N >= 0; N--) {
        const T = re + N, M = y[T], X = y[T + 1], ie = T + 1 < J ? (
          // #13559, fallback to el placeholder for unresolved async component
          X.el || X.placeholder
        ) : R;
        v[N] === 0 ? V(
          null,
          M,
          x,
          ie,
          I,
          C,
          U,
          D,
          $
        ) : nt && (he < 0 || N !== E[he] ? ge(M, x, ie, 2) : he--);
      }
    }
  }, ge = (p, y, x, R, I = null) => {
    const { el: C, type: U, transition: D, children: $, shapeFlag: N } = p;
    if (N & 6) {
      ge(p.component.subTree, y, x, R);
      return;
    }
    if (N & 128) {
      p.suspense.move(y, x, R);
      return;
    }
    if (N & 64) {
      U.move(p, y, x, ct);
      return;
    }
    if (U === De) {
      s(C, y, x);
      for (let z = 0; z < $.length; z++)
        ge($[z], y, x, R);
      s(p.anchor, y, x);
      return;
    }
    if (U === di) {
      be(p, y, x);
      return;
    }
    if (R !== 2 && N & 1 && D)
      if (R === 0)
        D.beforeEnter(C), s(C, y, x), Dt(() => D.enter(C), I);
      else {
        const { leave: z, delayLeave: Y, afterLeave: Q } = D, re = () => {
          p.ctx.isUnmounted ? i(C) : s(C, y, x);
        }, Pe = () => {
          z(C, () => {
            re(), Q && Q();
          });
        };
        Y ? Y(C, re, Pe) : Pe();
      }
    else
      s(C, y, x);
  }, Ke = (p, y, x, R = !1, I = !1) => {
    const {
      type: C,
      props: U,
      ref: D,
      children: $,
      dynamicChildren: N,
      shapeFlag: J,
      patchFlag: z,
      dirs: Y,
      cacheIndex: Q
    } = p;
    if (z === -2 && (I = !1), D != null && (bn(), Ms(D, null, x, p, !0), wn()), Q != null && (y.renderCache[Q] = void 0), J & 256) {
      y.ctx.deactivate(p);
      return;
    }
    const re = J & 1 && Y, Pe = !Fs(p);
    let he;
    if (Pe && (he = U && U.onVnodeBeforeUnmount) && nn(he, y, p), J & 6)
      ye(p.component, x, R);
    else {
      if (J & 128) {
        p.suspense.unmount(x, R);
        return;
      }
      re && Bn(p, null, y, "beforeUnmount"), J & 64 ? p.type.remove(
        p,
        y,
        x,
        ct,
        R
      ) : N && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !N.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (C !== De || z > 0 && z & 64) ? ce(
        N,
        y,
        x,
        !1,
        !0
      ) : (C === De && z & 384 || !I && J & 16) && ce($, y, x), R && Oe(p);
    }
    (Pe && (he = U && U.onVnodeUnmounted) || re) && Dt(() => {
      he && nn(he, y, p), re && Bn(p, null, y, "unmounted");
    }, x);
  }, Oe = (p) => {
    const { type: y, el: x, anchor: R, transition: I } = p;
    if (y === De) {
      H(x, R);
      return;
    }
    if (y === di) {
      B(p);
      return;
    }
    const C = () => {
      i(x), I && !I.persisted && I.afterLeave && I.afterLeave();
    };
    if (p.shapeFlag & 1 && I && !I.persisted) {
      const { leave: U, delayLeave: D } = I, $ = () => U(x, C);
      D ? D(p.el, C, $) : $();
    } else
      C();
  }, H = (p, y) => {
    let x;
    for (; p !== y; )
      x = _(p), i(p), p = x;
    i(y);
  }, ye = (p, y, x) => {
    const {
      bum: R,
      scope: I,
      job: C,
      subTree: U,
      um: D,
      m: $,
      a: N,
      parent: J,
      slots: { __: z }
    } = p;
    ua($), ua(N), R && fi(R), J && me(z) && z.forEach((Y) => {
      J.renderCache[Y] = void 0;
    }), I.stop(), C && (C.flags |= 8, Ke(U, p, y, x)), D && Dt(D, y), Dt(() => {
      p.isUnmounted = !0;
    }, y), y && y.pendingBranch && !y.isUnmounted && p.asyncDep && !p.asyncResolved && p.suspenseId === y.pendingId && (y.deps--, y.deps === 0 && y.resolve());
  }, ce = (p, y, x, R = !1, I = !1, C = 0) => {
    for (let U = C; U < p.length; U++)
      Ke(p[U], y, x, R, I);
  }, Me = (p) => {
    if (p.shapeFlag & 6)
      return Me(p.component.subTree);
    if (p.shapeFlag & 128)
      return p.suspense.next();
    const y = _(p.anchor || p.el), x = y && y[nf];
    return x ? _(x) : y;
  };
  let G = !1;
  const Ge = (p, y, x) => {
    p == null ? y._vnode && Ke(y._vnode, null, null, !0) : V(
      y._vnode || null,
      p,
      y,
      null,
      null,
      null,
      x
    ), y._vnode = p, G || (G = !0, ia(), Cl(), G = !1);
  }, ct = {
    p: V,
    um: Ke,
    m: ge,
    r: Oe,
    mt: tt,
    mc: Ne,
    pc: te,
    pbc: et,
    n: Me,
    o: e
  };
  return {
    render: Ge,
    hydrate: void 0,
    createApp: xf(Ge)
  };
}
function dr({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function $n({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Pf(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Kl(e, t, n = !1) {
  const s = e.children, i = t.children;
  if (me(s) && me(i))
    for (let r = 0; r < s.length; r++) {
      const o = s[r];
      let a = i[r];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[r] = Sn(i[r]), a.el = o.el), !n && a.patchFlag !== -2 && Kl(o, a)), a.type === Vi && (a.el = o.el), a.type === Ln && !a.el && (a.el = o.el);
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
const Mf = Symbol.for("v-scx"), Ff = () => hi(Mf);
function Qt(e, t, n) {
  return Yl(e, t, n);
}
function Yl(e, t, n = Qe) {
  const { immediate: s, deep: i, flush: r, once: o } = n, a = xt({}, n), l = t && s || !t && r !== "post";
  let h;
  if (Ws) {
    if (r === "sync") {
      const O = Ff();
      h = O.__watcherHandles || (O.__watcherHandles = []);
    } else if (!l) {
      const O = () => {
      };
      return O.stop = an, O.resume = an, O.pause = an, O;
    }
  }
  const c = Ct;
  a.call = (O, P, V) => un(O, c, P, V);
  let w = !1;
  r === "post" ? a.scheduler = (O) => {
    Dt(O, c && c.suspense);
  } : r !== "sync" && (w = !0, a.scheduler = (O, P) => {
    P ? O() : ao(O);
  }), a.augmentJob = (O) => {
    t && (O.flags |= 4), w && (O.flags |= 2, c && (O.id = c.uid, O.i = c));
  };
  const _ = Zu(e, t, a);
  return Ws && (h ? h.push(_) : l && _()), _;
}
function Df(e, t, n) {
  const s = this.proxy, i = pt(e) ? e.includes(".") ? Xl(s, e) : () => s[e] : e.bind(s, s);
  let r;
  ve(t) ? r = t : (r = t.handler, n = t);
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
const Bf = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Rn(t)}Modifiers`] || e[`${Pn(t)}Modifiers`];
function $f(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || Qe;
  let i = n;
  const r = t.startsWith("update:"), o = r && Bf(s, t.slice(7));
  o && (o.trim && (i = n.map((c) => pt(c) ? c.trim() : c)), o.number && (i = n.map(Cr)));
  let a, l = s[a = ar(t)] || // also try camelCase event handler (#2249)
  s[a = ar(Rn(t))];
  !l && r && (l = s[a = ar(Pn(t))]), l && un(
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
  if (!ve(e)) {
    const l = (h) => {
      const c = Zl(h, t, !0);
      c && (a = !0, xt(o, c));
    };
    !n && t.mixins.length && t.mixins.forEach(l), e.extends && l(e.extends), e.mixins && e.mixins.forEach(l);
  }
  return !r && !a ? (at(e) && s.set(e, null), null) : (me(r) ? r.forEach((l) => o[l] = null) : xt(o, r), at(e) && s.set(e, o), o);
}
function ji(e, t) {
  return !e || !Fi(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), qe(e, t[0].toLowerCase() + t.slice(1)) || qe(e, Pn(t)) || qe(e, t));
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
    setupState: O,
    ctx: P,
    inheritAttrs: V
  } = e, W = Ci(e);
  let K, le;
  try {
    if (n.shapeFlag & 4) {
      const B = i || s, q = B;
      K = on(
        h.call(
          q,
          B,
          c,
          w,
          O,
          _,
          P
        )
      ), le = a;
    } else {
      const B = t;
      K = on(
        B.length > 1 ? B(
          w,
          { attrs: a, slots: o, emit: l }
        ) : B(
          w,
          null
        )
      ), le = t.props ? a : Uf(a);
    }
  } catch (B) {
    Bs.length = 0, Hi(B, e, 1), K = ln(Ln);
  }
  let be = K;
  if (le && V !== !1) {
    const B = Object.keys(le), { shapeFlag: q } = be;
    B.length && q & 7 && (r && B.some(Zr) && (le = zf(
      le,
      r
    )), be = cs(be, le, !1, !0));
  }
  return n.dirs && (be = cs(be, null, !1, !0), be.dirs = be.dirs ? be.dirs.concat(n.dirs) : n.dirs), n.transition && lo(be, n.transition), K = be, Ci(W), K;
}
const Uf = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || Fi(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, zf = (e, t) => {
  const n = {};
  for (const s in e)
    (!Zr(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function Hf(e, t, n) {
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
        if (o[_] !== s[_] && !ji(h, _))
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
    if (t[r] !== e[r] && !ji(n, r))
      return !0;
  }
  return !1;
}
function qf({ vnode: e, parent: t }, n) {
  for (; t; ) {
    const s = t.subTree;
    if (s.suspense && s.suspense.activeBranch === e && (s.el = e.el), s === e)
      (e = t.vnode).el = n, t = t.parent;
    else
      break;
  }
}
const Jl = (e) => e.__isSuspense;
function Wf(e, t) {
  t && t.pendingBranch ? me(e) ? t.effects.push(...e) : t.effects.push(e) : ef(e);
}
const De = Symbol.for("v-fgt"), Vi = Symbol.for("v-txt"), Ln = Symbol.for("v-cmt"), di = Symbol.for("v-stc"), Bs = [];
let Bt = null;
function k(e = !1) {
  Bs.push(Bt = e ? null : []);
}
function jf() {
  Bs.pop(), Bt = Bs[Bs.length - 1] || null;
}
let qs = 1;
function da(e, t = !1) {
  qs += e, e < 0 && Bt && t && (Bt.hasOnce = !0);
}
function Ql(e) {
  return e.dynamicChildren = qs > 0 ? Bt || ns : null, jf(), qs > 0 && Bt && Bt.push(e), e;
}
function A(e, t, n, s, i, r) {
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
const nc = ({ key: e }) => e ?? null, pi = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? pt(e) || kt(e) || ve(e) ? { i: jt, r: e, k: t, f: !!n } : e : null);
function b(e, t = null, n = null, s = 0, i = null, r = e === De ? 0 : 1, o = !1, a = !1) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && nc(t),
    ref: t && pi(t),
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
    ctx: jt
  };
  return a ? (fo(l, n), r & 128 && e.normalize(l)) : n && (l.shapeFlag |= pt(n) ? 8 : 16), qs > 0 && // avoid a block node from tracking itself
  !o && // has current parent block
  Bt && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (l.patchFlag > 0 || r & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  l.patchFlag !== 32 && Bt.push(l), l;
}
const ln = Vf;
function Vf(e, t = null, n = null, s = 0, i = null, r = !1) {
  if ((!e || e === gf) && (e = Ln), tc(e)) {
    const a = cs(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && fo(a, n), qs > 0 && !r && Bt && (a.shapeFlag & 6 ? Bt[Bt.indexOf(e)] = a : Bt.push(a)), a.patchFlag = -2, a;
  }
  if (sh(e) && (e = e.__vccOpts), t) {
    t = Kf(t);
    let { class: a, style: l } = t;
    a && !pt(a) && (t.class = Je(a)), at(l) && (oo(l) && !me(l) && (l = xt({}, l)), t.style = Te(l));
  }
  const o = pt(e) ? 1 : Jl(e) ? 128 : sf(e) ? 64 : at(e) ? 4 : ve(e) ? 2 : 0;
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
function Kf(e) {
  return e ? oo(e) || zl(e) ? xt({}, e) : e : null;
}
function cs(e, t, n = !1, s = !1) {
  const { props: i, ref: r, patchFlag: o, children: a, transition: l } = e, h = t ? Gf(i || {}, t) : i, c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: h,
    key: h && nc(h),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && r ? me(r) ? r.concat(pi(t)) : [r, pi(t)] : pi(t)
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
  return l && s && lo(
    c,
    l.clone(c)
  ), c;
}
function dn(e = " ", t = 0) {
  return ln(Vi, null, e, t);
}
function Un(e, t) {
  const n = ln(di, null, e);
  return n.staticCount = t, n;
}
function ae(e = "", t = !1) {
  return t ? (k(), ec(Ln, null, e)) : ln(Ln, null, e);
}
function on(e) {
  return e == null || typeof e == "boolean" ? ln(Ln) : me(e) ? ln(
    De,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : tc(e) ? Sn(e) : ln(Vi, null, String(e));
}
function Sn(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : cs(e);
}
function fo(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (me(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const i = t.default;
      i && (i._c && (i._d = !1), fo(e, i()), i._c && (i._d = !0));
      return;
    } else {
      n = 32;
      const i = t._;
      !i && !zl(t) ? t._ctx = jt : i === 3 && jt && (jt.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else ve(t) ? (t = { default: t, _ctx: jt }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [dn(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function Gf(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const i in s)
      if (i === "class")
        t.class !== s.class && (t.class = Je([t.class, s.class]));
      else if (i === "style")
        t.style = Te([t.style, s.style]);
      else if (Fi(i)) {
        const r = t[i], o = s[i];
        o && r !== o && !(me(r) && r.includes(o)) && (t[i] = r ? [].concat(r, o) : o);
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
const Yf = Bl();
let Xf = 0;
function Zf(e, t, n) {
  const s = e.type, i = (t ? t.appContext : e.appContext) || Yf, r = {
    uid: Xf++,
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
    scope: new xu(
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
  return r.ctx = { _: r }, r.root = t ? t.root : r, r.emit = $f.bind(null, r), e.ce && e.ce(r), r;
}
let Ct = null;
const Jf = () => Ct || jt;
let Ii, Dr;
{
  const e = $i(), t = (n, s) => {
    let i;
    return (i = e[n]) || (i = e[n] = []), i.push(s), (r) => {
      i.length > 1 ? i.forEach((o) => o(r)) : i[0](r);
    };
  };
  Ii = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => Ct = n
  ), Dr = t(
    "__VUE_SSR_SETTERS__",
    (n) => Ws = n
  );
}
const Gs = (e) => {
  const t = Ct;
  return Ii(e), e.scope.on(), () => {
    e.scope.off(), Ii(t);
  };
}, pa = () => {
  Ct && Ct.scope.off(), Ii(null);
};
function sc(e) {
  return e.vnode.shapeFlag & 4;
}
let Ws = !1;
function Qf(e, t = !1, n = !1) {
  t && Dr(t);
  const { props: s, children: i } = e.vnode, r = sc(e);
  Tf(e, s, r, t), Rf(e, i, n || t);
  const o = r ? eh(e, t) : void 0;
  return t && Dr(!1), o;
}
function eh(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, mf);
  const { setup: s } = n;
  if (s) {
    bn();
    const i = e.setupContext = s.length > 1 ? nh(e) : null, r = Gs(e), o = Vs(
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
          Hi(l, e, 0);
        });
      e.asyncDep = o;
    } else
      ga(e, o);
  } else
    ic(e);
}
function ga(e, t, n) {
  ve(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : at(t) && (e.setupState = Tl(t)), ic(e);
}
function ic(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || an);
  {
    const i = Gs(e);
    bn();
    try {
      _f(e);
    } finally {
      wn(), i();
    }
  }
}
const th = {
  get(e, t) {
    return wt(e, "get", ""), e[t];
  }
};
function nh(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, th),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Ki(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Tl(Wu(e.exposed)), {
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
function sh(e) {
  return ve(e) && "__vccOpts" in e;
}
const pe = (e, t) => Yu(e, t, Ws), ih = "3.5.18";
/**
* @vue/runtime-dom v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Br;
const ma = typeof window < "u" && window.trustedTypes;
if (ma)
  try {
    Br = /* @__PURE__ */ ma.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const rc = Br ? (e) => Br.createHTML(e) : (e) => e, rh = "http://www.w3.org/2000/svg", oh = "http://www.w3.org/1998/Math/MathML", gn = typeof document < "u" ? document : null, _a = gn && /* @__PURE__ */ gn.createElement("template"), ah = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const i = t === "svg" ? gn.createElementNS(rh, e) : t === "mathml" ? gn.createElementNS(oh, e) : n ? gn.createElement(e, { is: n }) : gn.createElement(e);
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
}, lh = Symbol("_vtc");
function ch(e, t, n) {
  const s = e[lh];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const Li = Symbol("_vod"), oc = Symbol("_vsh"), uh = {
  beforeMount(e, { value: t }, { transition: n }) {
    e[Li] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : ys(e, t);
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
  e.style.display = t ? e[Li] : "none", e[oc] = !t;
}
const fh = Symbol(""), hh = /(^|;)\s*display\s*:/;
function dh(e, t, n) {
  const s = e.style, i = pt(n);
  let r = !1;
  if (n && !i) {
    if (t)
      if (pt(t))
        for (const o of t.split(";")) {
          const a = o.slice(0, o.indexOf(":")).trim();
          n[a] == null && gi(s, a, "");
        }
      else
        for (const o in t)
          n[o] == null && gi(s, o, "");
    for (const o in n)
      o === "display" && (r = !0), gi(s, o, n[o]);
  } else if (i) {
    if (t !== n) {
      const o = s[fh];
      o && (n += ";" + o), s.cssText = n, r = hh.test(n);
    }
  } else t && e.removeAttribute("style");
  Li in e && (e[Li] = r ? s.display : "", e[oc] && (s.display = "none"));
}
const ya = /\s*!important$/;
function gi(e, t, n) {
  if (me(n))
    n.forEach((s) => gi(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = ph(e, t);
    ya.test(n) ? e.setProperty(
      Pn(s),
      n.replace(ya, ""),
      "important"
    ) : e[s] = n;
  }
}
const va = ["Webkit", "Moz", "ms"], pr = {};
function ph(e, t) {
  const n = pr[t];
  if (n)
    return n;
  let s = Rn(t);
  if (s !== "filter" && s in e)
    return pr[t] = s;
  s = ol(s);
  for (let i = 0; i < va.length; i++) {
    const r = va[i] + s;
    if (r in e)
      return pr[t] = r;
  }
  return t;
}
const ba = "http://www.w3.org/1999/xlink";
function wa(e, t, n, s, i, r = ku(t)) {
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
function gh(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const xa = Symbol("_vei");
function mh(e, t, n, s, i = null) {
  const r = e[xa] || (e[xa] = {}), o = r[t];
  if (s && o)
    o.value = s;
  else {
    const [a, l] = _h(t);
    if (s) {
      const h = r[t] = bh(
        s,
        i
      );
      ts(e, a, h, l);
    } else o && (gh(e, a, o, l), r[t] = void 0);
  }
}
const Aa = /(?:Once|Passive|Capture)$/;
function _h(e) {
  let t;
  if (Aa.test(e)) {
    t = {};
    let s;
    for (; s = e.match(Aa); )
      e = e.slice(0, e.length - s[0].length), t[s[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : Pn(e.slice(2)), t];
}
let gr = 0;
const yh = /* @__PURE__ */ Promise.resolve(), vh = () => gr || (yh.then(() => gr = 0), gr = Date.now());
function bh(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    un(
      wh(s, n.value),
      t,
      5,
      [s]
    );
  };
  return n.value = e, n.attached = vh(), n;
}
function wh(e, t) {
  if (me(t)) {
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
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, kh = (e, t, n, s, i, r) => {
  const o = i === "svg";
  t === "class" ? ch(e, s, o) : t === "style" ? dh(e, n, s) : Fi(t) ? Zr(t) || mh(e, t, n, s, r) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : xh(e, t, s, o)) ? (ka(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && wa(e, t, s, o, r, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && (/[A-Z]/.test(t) || !pt(s)) ? ka(e, Rn(t), s, r, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), wa(e, t, s, o));
};
function xh(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && Ta(t) && ve(n));
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
  return me(t) ? (n) => fi(t, n) : t;
};
function Ah(e) {
  e.target.composing = !0;
}
function Ea(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const mr = Symbol("_assign"), zn = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, i) {
    e[mr] = Sa(i);
    const r = s || i.props && i.props.type === "number";
    ts(e, t ? "change" : "input", (o) => {
      if (o.target.composing) return;
      let a = e.value;
      n && (a = a.trim()), r && (a = Cr(a)), e[mr](a);
    }), n && ts(e, "change", () => {
      e.value = e.value.trim();
    }), t || (ts(e, "compositionstart", Ah), ts(e, "compositionend", Ea), ts(e, "change", Ea));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: i, number: r } }, o) {
    if (e[mr] = Sa(o), e.composing) return;
    const a = (r || e.type === "number") && !/^0\d/.test(e.value) ? Cr(e.value) : e.value, l = t ?? "";
    a !== l && (document.activeElement === e && e.type !== "range" && (s && t === n || i && e.value.trim() === l) || (e.value = l));
  }
}, Th = ["ctrl", "shift", "alt", "meta"], Sh = {
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
  exact: (e, t) => Th.some((n) => e[`${n}Key`] && !t.includes(n))
}, qn = (e, t) => {
  const n = e._withMods || (e._withMods = {}), s = t.join(".");
  return n[s] || (n[s] = (i, ...r) => {
    for (let o = 0; o < t.length; o++) {
      const a = Sh[t[o]];
      if (a && a(i, t)) return;
    }
    return e(i, ...r);
  });
}, Eh = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, mi = (e, t) => {
  const n = e._withKeys || (e._withKeys = {}), s = t.join(".");
  return n[s] || (n[s] = (i) => {
    if (!("key" in i))
      return;
    const r = Pn(i.key);
    if (t.some(
      (o) => o === r || Eh[o] === r
    ))
      return e(i);
  });
}, Ch = /* @__PURE__ */ xt({ patchProp: kh }, ah);
let Ca;
function Rh() {
  return Ca || (Ca = Lf(Ch));
}
const Ih = (...e) => {
  const t = Rh().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const i = Oh(s);
    if (!i) return;
    const r = t._component;
    !ve(r) && !r.render && !r.template && (r.template = i.innerHTML), i.nodeType === 1 && (i.textContent = "");
    const o = n(i, !1, Lh(i));
    return i instanceof Element && (i.removeAttribute("v-cloak"), i.setAttribute("data-v-app", "")), o;
  }, t;
};
function Lh(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function Oh(e) {
  return pt(e) ? document.querySelector(e) : e;
}
const ls = (e) => {
  const t = e.replace("#", ""), n = parseInt(t.substr(0, 2), 16), s = parseInt(t.substr(2, 2), 16), i = parseInt(t.substr(4, 2), 16);
  return (n * 299 + s * 587 + i * 114) / 1e3 < 128;
}, Ph = (e, t) => {
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
function ho() {
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
var Vn = ho();
function ac(e) {
  Vn = e;
}
var $s = { exec: () => null };
function We(e, t = "") {
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
}, Mh = /^(?:[ \t]*(?:\n|$))+/, Fh = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Dh = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Ys = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Bh = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, po = /(?:[*+-]|\d{1,9}[.)])/, lc = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, cc = We(lc).replace(/bull/g, po).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), $h = We(lc).replace(/bull/g, po).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), go = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Uh = /^[^\n]+/, mo = /(?!\s*\])(?:\\.|[^\[\]\\])+/, zh = We(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", mo).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Hh = We(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, po).getRegex(), Gi = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", _o = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, qh = We(
  "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))",
  "i"
).replace("comment", _o).replace("tag", Gi).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), uc = We(go).replace("hr", Ys).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Gi).getRegex(), Wh = We(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", uc).getRegex(), yo = {
  blockquote: Wh,
  code: Fh,
  def: zh,
  fences: Dh,
  heading: Bh,
  hr: Ys,
  html: qh,
  lheading: cc,
  list: Hh,
  newline: Mh,
  paragraph: uc,
  table: $s,
  text: Uh
}, Ra = We(
  "^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
).replace("hr", Ys).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Gi).getRegex(), jh = {
  ...yo,
  lheading: $h,
  table: Ra,
  paragraph: We(go).replace("hr", Ys).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Ra).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Gi).getRegex()
}, Vh = {
  ...yo,
  html: We(
    `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`
  ).replace("comment", _o).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: $s,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: We(go).replace("hr", Ys).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", cc).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Kh = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Gh = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, fc = /^( {2,}|\\)\n(?!\s*$)/, Yh = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Yi = /[\p{P}\p{S}]/u, vo = /[\s\p{P}\p{S}]/u, hc = /[^\s\p{P}\p{S}]/u, Xh = We(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, vo).getRegex(), dc = /(?!~)[\p{P}\p{S}]/u, Zh = /(?!~)[\s\p{P}\p{S}]/u, Jh = /(?:[^\s\p{P}\p{S}]|~)/u, Qh = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, pc = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, ed = We(pc, "u").replace(/punct/g, Yi).getRegex(), td = We(pc, "u").replace(/punct/g, dc).getRegex(), gc = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", nd = We(gc, "gu").replace(/notPunctSpace/g, hc).replace(/punctSpace/g, vo).replace(/punct/g, Yi).getRegex(), sd = We(gc, "gu").replace(/notPunctSpace/g, Jh).replace(/punctSpace/g, Zh).replace(/punct/g, dc).getRegex(), id = We(
  "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)",
  "gu"
).replace(/notPunctSpace/g, hc).replace(/punctSpace/g, vo).replace(/punct/g, Yi).getRegex(), rd = We(/\\(punct)/, "gu").replace(/punct/g, Yi).getRegex(), od = We(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), ad = We(_o).replace("(?:-->|$)", "-->").getRegex(), ld = We(
  "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>"
).replace("comment", ad).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Oi = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, cd = We(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", Oi).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), mc = We(/^!?\[(label)\]\[(ref)\]/).replace("label", Oi).replace("ref", mo).getRegex(), _c = We(/^!?\[(ref)\](?:\[\])?/).replace("ref", mo).getRegex(), ud = We("reflink|nolink(?!\\()", "g").replace("reflink", mc).replace("nolink", _c).getRegex(), bo = {
  _backpedal: $s,
  // only used for GFM url
  anyPunctuation: rd,
  autolink: od,
  blockSkip: Qh,
  br: fc,
  code: Gh,
  del: $s,
  emStrongLDelim: ed,
  emStrongRDelimAst: nd,
  emStrongRDelimUnd: id,
  escape: Kh,
  link: cd,
  nolink: _c,
  punctuation: Xh,
  reflink: mc,
  reflinkSearch: ud,
  tag: ld,
  text: Yh,
  url: $s
}, fd = {
  ...bo,
  link: We(/^!?\[(label)\]\((.*?)\)/).replace("label", Oi).getRegex(),
  reflink: We(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Oi).getRegex()
}, $r = {
  ...bo,
  emStrongRDelimAst: sd,
  emStrongLDelim: td,
  url: We(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, hd = {
  ...$r,
  br: We(fc).replace("{2,}", "*").getRegex(),
  text: We($r.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, oi = {
  normal: yo,
  gfm: jh,
  pedantic: Vh
}, bs = {
  normal: bo,
  gfm: $r,
  breaks: hd,
  pedantic: fd
}, dd = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Ia = (e) => dd[e];
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
function pd(e, t) {
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
function gd(e, t, n) {
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
var Pi = class {
  // set by the lexer
  constructor(e) {
    Ze(this, "options");
    Ze(this, "rules");
    // set by the lexer
    Ze(this, "lexer");
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
      const n = t[0], s = gd(n, t[3] || "", this.rules);
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
          const O = _, P = O.raw + `
` + n.join(`
`), V = this.blockquote(P);
          r[r.length - 1] = V, s = s.substring(0, s.length - O.raw.length) + V.raw, i = i.substring(0, i.length - O.text.length) + V.text;
          break;
        } else if ((_ == null ? void 0 : _.type) === "list") {
          const O = _, P = O.raw + `
` + n.join(`
`), V = this.list(P);
          r[r.length - 1] = V, s = s.substring(0, s.length - _.raw.length) + V.raw, i = i.substring(0, i.length - O.raw.length) + V.raw, n = P.substring(r.at(-1).raw.length).split(`
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
`, 1)[0].replace(this.rules.other.listReplaceTabs, (K) => " ".repeat(3 * K.length)), _ = e.split(`
`, 1)[0], O = !w.trim(), P = 0;
        if (this.options.pedantic ? (P = 2, c = w.trimStart()) : O ? P = t[1].length + 1 : (P = t[2].search(this.rules.other.nonSpaceChar), P = P > 4 ? 1 : P, c = w.slice(P), P += t[1].length), O && this.rules.other.blankLine.test(_) && (h += _ + `
`, e = e.substring(_.length + 1), l = !0), !l) {
          const K = this.rules.other.nextBulletRegex(P), le = this.rules.other.hrRegex(P), be = this.rules.other.fencesBeginRegex(P), B = this.rules.other.headingBeginRegex(P), q = this.rules.other.htmlBeginRegex(P);
          for (; e; ) {
            const oe = e.split(`
`, 1)[0];
            let ee;
            if (_ = oe, this.options.pedantic ? (_ = _.replace(this.rules.other.listReplaceNesting, "  "), ee = _) : ee = _.replace(this.rules.other.tabCharGlobal, "    "), be.test(_) || B.test(_) || q.test(_) || K.test(_) || le.test(_))
              break;
            if (ee.search(this.rules.other.nonSpaceChar) >= P || !_.trim())
              c += `
` + ee.slice(P);
            else {
              if (O || w.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || be.test(w) || B.test(w) || le.test(w))
                break;
              c += `
` + _;
            }
            !O && !_.trim() && (O = !0), h += oe + `
`, e = e.substring(oe.length + 1), w = ee.slice(P);
          }
        }
        i.loose || (o ? i.loose = !0 : this.rules.other.doubleBlankLine.test(h) && (o = !0));
        let V = null, W;
        this.options.gfm && (V = this.rules.other.listIsTask.exec(c), V && (W = V[0] !== "[ ] ", c = c.replace(this.rules.other.listReplaceTask, ""))), i.items.push({
          type: "list_item",
          raw: h,
          task: !!V,
          checked: W,
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
        const r = pd(t[2], "()");
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
          const P = _.slice(1, -1);
          return {
            type: "em",
            raw: _,
            text: P,
            tokens: this.lexer.inlineTokens(P)
          };
        }
        const O = _.slice(2, -2);
        return {
          type: "strong",
          raw: _,
          text: O,
          tokens: this.lexer.inlineTokens(O)
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
}, yn = class Ur {
  constructor(t) {
    Ze(this, "tokens");
    Ze(this, "options");
    Ze(this, "state");
    Ze(this, "tokenizer");
    Ze(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = t || Vn, this.options.tokenizer = this.options.tokenizer || new Pi(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      other: Rt,
      block: oi.normal,
      inline: bs.normal
    };
    this.options.pedantic ? (n.block = oi.pedantic, n.inline = bs.pedantic) : this.options.gfm && (n.block = oi.gfm, this.options.breaks ? n.inline = bs.breaks : n.inline = bs.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: oi,
      inline: bs
    };
  }
  /**
   * Static Lex Method
   */
  static lex(t, n) {
    return new Ur(n).lex(t);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(t, n) {
    return new Ur(n).inlineTokens(t);
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
        const O = t.slice(1);
        let P;
        this.options.extensions.startInline.forEach((V) => {
          P = V.call({ lexer: this }, O), typeof P == "number" && P >= 0 && (_ = Math.min(_, P));
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
    Ze(this, "options");
    Ze(this, "parser");
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
}, wo = class {
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
}, vn = class zr {
  constructor(t) {
    Ze(this, "options");
    Ze(this, "renderer");
    Ze(this, "textRenderer");
    this.options = t || Vn, this.options.renderer = this.options.renderer || new Ni(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new wo();
  }
  /**
   * Static Parse Method
   */
  static parse(t, n) {
    return new zr(n).parse(t);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(t, n) {
    return new zr(n).parseInline(t);
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
}, Sr, _i = (Sr = class {
  constructor(e) {
    Ze(this, "options");
    Ze(this, "block");
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
}, Ze(Sr, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
])), Sr), md = class {
  constructor(...e) {
    Ze(this, "defaults", ho());
    Ze(this, "options", this.setOptions);
    Ze(this, "parse", this.parseMarkdown(!0));
    Ze(this, "parseInline", this.parseMarkdown(!1));
    Ze(this, "Parser", vn);
    Ze(this, "Renderer", Ni);
    Ze(this, "TextRenderer", wo);
    Ze(this, "Lexer", yn);
    Ze(this, "Tokenizer", Pi);
    Ze(this, "Hooks", _i);
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
        const i = this.defaults.tokenizer || new Pi(this.defaults);
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
        const i = this.defaults.hooks || new _i();
        for (const r in n.hooks) {
          if (!(r in i))
            throw new Error(`hook '${r}' does not exist`);
          if (["options", "block"].includes(r))
            continue;
          const o = r, a = n.hooks[o], l = i[o];
          _i.passThroughHooks.has(r) ? i[o] = (h) => {
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
}, jn = new md();
function Be(e, t) {
  return jn.parse(e, t);
}
Be.options = Be.setOptions = function(e) {
  return jn.setOptions(e), Be.defaults = jn.defaults, ac(Be.defaults), Be;
};
Be.getDefaults = ho;
Be.defaults = Vn;
Be.use = function(...e) {
  return jn.use(...e), Be.defaults = jn.defaults, ac(Be.defaults), Be;
};
Be.walkTokens = function(e, t) {
  return jn.walkTokens(e, t);
};
Be.parseInline = jn.parseInline;
Be.Parser = vn;
Be.parser = vn.parse;
Be.Renderer = Ni;
Be.TextRenderer = wo;
Be.Lexer = yn;
Be.lexer = yn.lex;
Be.Tokenizer = Pi;
Be.Hooks = _i;
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
  entries: yc,
  setPrototypeOf: Na,
  isFrozen: _d,
  getPrototypeOf: yd,
  getOwnPropertyDescriptor: vd
} = Object;
let {
  freeze: It,
  seal: Kt,
  create: vc
} = Object, {
  apply: Hr,
  construct: qr
} = typeof Reflect < "u" && Reflect;
It || (It = function(t) {
  return t;
});
Kt || (Kt = function(t) {
  return t;
});
Hr || (Hr = function(t, n, s) {
  return t.apply(n, s);
});
qr || (qr = function(t, n) {
  return new t(...n);
});
const ai = Lt(Array.prototype.forEach), bd = Lt(Array.prototype.lastIndexOf), Ma = Lt(Array.prototype.pop), ks = Lt(Array.prototype.push), wd = Lt(Array.prototype.splice), yi = Lt(String.prototype.toLowerCase), _r = Lt(String.prototype.toString), Fa = Lt(String.prototype.match), xs = Lt(String.prototype.replace), kd = Lt(String.prototype.indexOf), xd = Lt(String.prototype.trim), Zt = Lt(Object.prototype.hasOwnProperty), Tt = Lt(RegExp.prototype.test), As = Ad(TypeError);
function Lt(e) {
  return function(t) {
    t instanceof RegExp && (t.lastIndex = 0);
    for (var n = arguments.length, s = new Array(n > 1 ? n - 1 : 0), i = 1; i < n; i++)
      s[i - 1] = arguments[i];
    return Hr(e, t, s);
  };
}
function Ad(e) {
  return function() {
    for (var t = arguments.length, n = new Array(t), s = 0; s < t; s++)
      n[s] = arguments[s];
    return qr(e, n);
  };
}
function Ee(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : yi;
  Na && Na(e, null);
  let s = t.length;
  for (; s--; ) {
    let i = t[s];
    if (typeof i == "string") {
      const r = n(i);
      r !== i && (_d(t) || (t[s] = r), i = r);
    }
    e[i] = !0;
  }
  return e;
}
function Td(e) {
  for (let t = 0; t < e.length; t++)
    Zt(e, t) || (e[t] = null);
  return e;
}
function pn(e) {
  const t = vc(null);
  for (const [n, s] of yc(e))
    Zt(e, n) && (Array.isArray(s) ? t[n] = Td(s) : s && typeof s == "object" && s.constructor === Object ? t[n] = pn(s) : t[n] = s);
  return t;
}
function Ts(e, t) {
  for (; e !== null; ) {
    const s = vd(e, t);
    if (s) {
      if (s.get)
        return Lt(s.get);
      if (typeof s.value == "function")
        return Lt(s.value);
    }
    e = yd(e);
  }
  function n() {
    return null;
  }
  return n;
}
const Da = It(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "section", "select", "shadow", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]), yr = It(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]), vr = It(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]), Sd = It(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]), br = It(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]), Ed = It(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]), Ba = It(["#text"]), $a = It(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns", "slot"]), wr = It(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]), Ua = It(["accent", "accentunder", "align", "bevelled", "close", "columnsalign", "columnlines", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lspace", "lquote", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]), li = It(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]), Cd = Kt(/\{\{[\w\W]*|[\w\W]*\}\}/gm), Rd = Kt(/<%[\w\W]*|[\w\W]*%>/gm), Id = Kt(/\$\{[\w\W]*/gm), Ld = Kt(/^data-[\-\w.\u00B7-\uFFFF]+$/), Od = Kt(/^aria-[\-\w]+$/), bc = Kt(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
), Pd = Kt(/^(?:\w+script|data):/i), Nd = Kt(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
), wc = Kt(/^html$/i), Md = Kt(/^[a-z][.\w]*(-[.\w]+)+$/i);
var za = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ARIA_ATTR: Od,
  ATTR_WHITESPACE: Nd,
  CUSTOM_ELEMENT: Md,
  DATA_ATTR: Ld,
  DOCTYPE_NAME: wc,
  ERB_EXPR: Rd,
  IS_ALLOWED_URI: bc,
  IS_SCRIPT_OR_DATA: Pd,
  MUSTACHE_EXPR: Cd,
  TMPLIT_EXPR: Id
});
const Ss = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9
}, Fd = function() {
  return typeof window > "u" ? null : window;
}, Dd = function(t, n) {
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
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : Fd();
  const t = (j) => kc(j);
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
    trustedTypes: O
  } = e, P = l.prototype, V = Ts(P, "cloneNode"), W = Ts(P, "remove"), K = Ts(P, "nextSibling"), le = Ts(P, "childNodes"), be = Ts(P, "parentNode");
  if (typeof o == "function") {
    const j = n.createElement("template");
    j.content && j.content.ownerDocument && (n = j.content.ownerDocument);
  }
  let B, q = "";
  const {
    implementation: oe,
    createNodeIterator: ee,
    createDocumentFragment: Ne,
    getElementsByTagName: it
  } = n, {
    importNode: et
  } = s;
  let Ce = Ha();
  t.isSupported = typeof yc == "function" && typeof be == "function" && oe && oe.createHTMLDocument !== void 0;
  const {
    MUSTACHE_EXPR: we,
    ERB_EXPR: Ve,
    TMPLIT_EXPR: tt,
    DATA_ATTR: lt,
    ARIA_ATTR: fe,
    IS_SCRIPT_OR_DATA: _e,
    ATTR_WHITESPACE: te,
    CUSTOM_ELEMENT: ot
  } = za;
  let {
    IS_ALLOWED_URI: Re
  } = za, ge = null;
  const Ke = Ee({}, [...Da, ...yr, ...vr, ...br, ...Ba]);
  let Oe = null;
  const H = Ee({}, [...$a, ...wr, ...Ua, ...li]);
  let ye = Object.seal(vc(null, {
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
  })), ce = null, Me = null, G = !0, Ge = !0, ct = !1, At = !0, p = !1, y = !0, x = !1, R = !1, I = !1, C = !1, U = !1, D = !1, $ = !0, N = !1;
  const J = "user-content-";
  let z = !0, Y = !1, Q = {}, re = null;
  const Pe = Ee({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let he = null;
  const ut = Ee({}, ["audio", "video", "img", "source", "image", "track"]);
  let $e = null;
  const nt = Ee({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]), f = "http://www.w3.org/1998/Math/MathML", v = "http://www.w3.org/2000/svg", E = "http://www.w3.org/1999/xhtml";
  let T = E, M = !1, X = null;
  const ie = Ee({}, [f, v, E], _r);
  let xe = Ee({}, ["mi", "mo", "mn", "ms", "mtext"]), Se = Ee({}, ["annotation-xml"]);
  const Ye = Ee({}, ["title", "style", "font", "a", "script"]);
  let Fe = null;
  const gt = ["application/xhtml+xml", "text/html"], _t = "text/html";
  let Ue = null, Gt = null;
  const Xs = n.createElement("form"), $t = function(m) {
    return m instanceof RegExp || m instanceof Function;
  }, Nn = function() {
    let m = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (!(Gt && Gt === m)) {
      if ((!m || typeof m != "object") && (m = {}), m = pn(m), Fe = // eslint-disable-next-line unicorn/prefer-includes
      gt.indexOf(m.PARSER_MEDIA_TYPE) === -1 ? _t : m.PARSER_MEDIA_TYPE, Ue = Fe === "application/xhtml+xml" ? _r : yi, ge = Zt(m, "ALLOWED_TAGS") ? Ee({}, m.ALLOWED_TAGS, Ue) : Ke, Oe = Zt(m, "ALLOWED_ATTR") ? Ee({}, m.ALLOWED_ATTR, Ue) : H, X = Zt(m, "ALLOWED_NAMESPACES") ? Ee({}, m.ALLOWED_NAMESPACES, _r) : ie, $e = Zt(m, "ADD_URI_SAFE_ATTR") ? Ee(pn(nt), m.ADD_URI_SAFE_ATTR, Ue) : nt, he = Zt(m, "ADD_DATA_URI_TAGS") ? Ee(pn(ut), m.ADD_DATA_URI_TAGS, Ue) : ut, re = Zt(m, "FORBID_CONTENTS") ? Ee({}, m.FORBID_CONTENTS, Ue) : Pe, ce = Zt(m, "FORBID_TAGS") ? Ee({}, m.FORBID_TAGS, Ue) : pn({}), Me = Zt(m, "FORBID_ATTR") ? Ee({}, m.FORBID_ATTR, Ue) : pn({}), Q = Zt(m, "USE_PROFILES") ? m.USE_PROFILES : !1, G = m.ALLOW_ARIA_ATTR !== !1, Ge = m.ALLOW_DATA_ATTR !== !1, ct = m.ALLOW_UNKNOWN_PROTOCOLS || !1, At = m.ALLOW_SELF_CLOSE_IN_ATTR !== !1, p = m.SAFE_FOR_TEMPLATES || !1, y = m.SAFE_FOR_XML !== !1, x = m.WHOLE_DOCUMENT || !1, C = m.RETURN_DOM || !1, U = m.RETURN_DOM_FRAGMENT || !1, D = m.RETURN_TRUSTED_TYPE || !1, I = m.FORCE_BODY || !1, $ = m.SANITIZE_DOM !== !1, N = m.SANITIZE_NAMED_PROPS || !1, z = m.KEEP_CONTENT !== !1, Y = m.IN_PLACE || !1, Re = m.ALLOWED_URI_REGEXP || bc, T = m.NAMESPACE || E, xe = m.MATHML_TEXT_INTEGRATION_POINTS || xe, Se = m.HTML_INTEGRATION_POINTS || Se, ye = m.CUSTOM_ELEMENT_HANDLING || {}, m.CUSTOM_ELEMENT_HANDLING && $t(m.CUSTOM_ELEMENT_HANDLING.tagNameCheck) && (ye.tagNameCheck = m.CUSTOM_ELEMENT_HANDLING.tagNameCheck), m.CUSTOM_ELEMENT_HANDLING && $t(m.CUSTOM_ELEMENT_HANDLING.attributeNameCheck) && (ye.attributeNameCheck = m.CUSTOM_ELEMENT_HANDLING.attributeNameCheck), m.CUSTOM_ELEMENT_HANDLING && typeof m.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements == "boolean" && (ye.allowCustomizedBuiltInElements = m.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements), p && (Ge = !1), U && (C = !0), Q && (ge = Ee({}, Ba), Oe = [], Q.html === !0 && (Ee(ge, Da), Ee(Oe, $a)), Q.svg === !0 && (Ee(ge, yr), Ee(Oe, wr), Ee(Oe, li)), Q.svgFilters === !0 && (Ee(ge, vr), Ee(Oe, wr), Ee(Oe, li)), Q.mathMl === !0 && (Ee(ge, br), Ee(Oe, Ua), Ee(Oe, li))), m.ADD_TAGS && (ge === Ke && (ge = pn(ge)), Ee(ge, m.ADD_TAGS, Ue)), m.ADD_ATTR && (Oe === H && (Oe = pn(Oe)), Ee(Oe, m.ADD_ATTR, Ue)), m.ADD_URI_SAFE_ATTR && Ee($e, m.ADD_URI_SAFE_ATTR, Ue), m.FORBID_CONTENTS && (re === Pe && (re = pn(re)), Ee(re, m.FORBID_CONTENTS, Ue)), z && (ge["#text"] = !0), x && Ee(ge, ["html", "head", "body"]), ge.table && (Ee(ge, ["tbody"]), delete ce.tbody), m.TRUSTED_TYPES_POLICY) {
        if (typeof m.TRUSTED_TYPES_POLICY.createHTML != "function")
          throw As('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
        if (typeof m.TRUSTED_TYPES_POLICY.createScriptURL != "function")
          throw As('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
        B = m.TRUSTED_TYPES_POLICY, q = B.createHTML("");
      } else
        B === void 0 && (B = Dd(O, i)), B !== null && typeof q == "string" && (q = B.createHTML(""));
      It && It(m), Gt = m;
    }
  }, tn = Ee({}, [...yr, ...vr, ...Sd]), fs = Ee({}, [...br, ...Ed]), Kn = function(m) {
    let F = be(m);
    (!F || !F.tagName) && (F = {
      namespaceURI: T,
      tagName: "template"
    });
    const Z = yi(m.tagName), Xe = yi(F.tagName);
    return X[m.namespaceURI] ? m.namespaceURI === v ? F.namespaceURI === E ? Z === "svg" : F.namespaceURI === f ? Z === "svg" && (Xe === "annotation-xml" || xe[Xe]) : !!tn[Z] : m.namespaceURI === f ? F.namespaceURI === E ? Z === "math" : F.namespaceURI === v ? Z === "math" && Se[Xe] : !!fs[Z] : m.namespaceURI === E ? F.namespaceURI === v && !Se[Xe] || F.namespaceURI === f && !xe[Xe] ? !1 : !fs[Z] && (Ye[Z] || !tn[Z]) : !!(Fe === "application/xhtml+xml" && X[m.namespaceURI]) : !1;
  }, Nt = function(m) {
    ks(t.removed, {
      element: m
    });
    try {
      be(m).removeChild(m);
    } catch {
      W(m);
    }
  }, Ut = function(m, F) {
    try {
      ks(t.removed, {
        attribute: F.getAttributeNode(m),
        from: F
      });
    } catch {
      ks(t.removed, {
        attribute: null,
        from: F
      });
    }
    if (F.removeAttribute(m), m === "is")
      if (C || U)
        try {
          Nt(F);
        } catch {
        }
      else
        try {
          F.setAttribute(m, "");
        } catch {
        }
  }, Zs = function(m) {
    let F = null, Z = null;
    if (I)
      m = "<remove></remove>" + m;
    else {
      const Ie = Fa(m, /^[\r\n\t ]+/);
      Z = Ie && Ie[0];
    }
    Fe === "application/xhtml+xml" && T === E && (m = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + m + "</body></html>");
    const Xe = B ? B.createHTML(m) : m;
    if (T === E)
      try {
        F = new _().parseFromString(Xe, Fe);
      } catch {
      }
    if (!F || !F.documentElement) {
      F = oe.createDocument(T, "template", null);
      try {
        F.documentElement.innerHTML = M ? q : Xe;
      } catch {
      }
    }
    const rt = F.body || F.documentElement;
    return m && Z && rt.insertBefore(n.createTextNode(Z), rt.childNodes[0] || null), T === E ? it.call(F, x ? "html" : "body")[0] : x ? F.documentElement : rt;
  }, Mn = function(m) {
    return ee.call(
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
  function zt(j, m, F) {
    ai(j, (Z) => {
      Z.call(t, m, F, Gt);
    });
  }
  const Fn = function(m) {
    let F = null;
    if (zt(Ce.beforeSanitizeElements, m, null), Gn(m))
      return Nt(m), !0;
    const Z = Ue(m.nodeName);
    if (zt(Ce.uponSanitizeElement, m, {
      tagName: Z,
      allowedTags: ge
    }), y && m.hasChildNodes() && !Js(m.firstElementChild) && Tt(/<[/\w!]/g, m.innerHTML) && Tt(/<[/\w!]/g, m.textContent) || m.nodeType === Ss.progressingInstruction || y && m.nodeType === Ss.comment && Tt(/<[/\w]/g, m.data))
      return Nt(m), !0;
    if (!ge[Z] || ce[Z]) {
      if (!ce[Z] && Mt(Z) && (ye.tagNameCheck instanceof RegExp && Tt(ye.tagNameCheck, Z) || ye.tagNameCheck instanceof Function && ye.tagNameCheck(Z)))
        return !1;
      if (z && !re[Z]) {
        const Xe = be(m) || m.parentNode, rt = le(m) || m.childNodes;
        if (rt && Xe) {
          const Ie = rt.length;
          for (let ht = Ie - 1; ht >= 0; --ht) {
            const yt = V(rt[ht], !0);
            yt.__removalCount = (m.__removalCount || 0) + 1, Xe.insertBefore(yt, K(m));
          }
        }
      }
      return Nt(m), !0;
    }
    return m instanceof l && !Kn(m) || (Z === "noscript" || Z === "noembed" || Z === "noframes") && Tt(/<\/no(script|embed|frames)/i, m.innerHTML) ? (Nt(m), !0) : (p && m.nodeType === Ss.text && (F = m.textContent, ai([we, Ve, tt], (Xe) => {
      F = xs(F, Xe, " ");
    }), m.textContent !== F && (ks(t.removed, {
      element: m.cloneNode()
    }), m.textContent = F)), zt(Ce.afterSanitizeElements, m, null), !1);
  }, Yn = function(m, F, Z) {
    if ($ && (F === "id" || F === "name") && (Z in n || Z in Xs))
      return !1;
    if (!(Ge && !Me[F] && Tt(lt, F))) {
      if (!(G && Tt(fe, F))) {
        if (!Oe[F] || Me[F]) {
          if (
            // First condition does a very basic check if a) it's basically a valid custom element tagname AND
            // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
            !(Mt(m) && (ye.tagNameCheck instanceof RegExp && Tt(ye.tagNameCheck, m) || ye.tagNameCheck instanceof Function && ye.tagNameCheck(m)) && (ye.attributeNameCheck instanceof RegExp && Tt(ye.attributeNameCheck, F) || ye.attributeNameCheck instanceof Function && ye.attributeNameCheck(F)) || // Alternative, second condition checks if it's an `is`-attribute, AND
            // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            F === "is" && ye.allowCustomizedBuiltInElements && (ye.tagNameCheck instanceof RegExp && Tt(ye.tagNameCheck, Z) || ye.tagNameCheck instanceof Function && ye.tagNameCheck(Z)))
          ) return !1;
        } else if (!$e[F]) {
          if (!Tt(Re, xs(Z, te, ""))) {
            if (!((F === "src" || F === "xlink:href" || F === "href") && m !== "script" && kd(Z, "data:") === 0 && he[m])) {
              if (!(ct && !Tt(_e, xs(Z, te, "")))) {
                if (Z)
                  return !1;
              }
            }
          }
        }
      }
    }
    return !0;
  }, Mt = function(m) {
    return m !== "annotation-xml" && Fa(m, ot);
  }, Ft = function(m) {
    zt(Ce.beforeSanitizeAttributes, m, null);
    const {
      attributes: F
    } = m;
    if (!F || Gn(m))
      return;
    const Z = {
      attrName: "",
      attrValue: "",
      keepAttr: !0,
      allowedAttributes: Oe,
      forceKeepAttr: void 0
    };
    let Xe = F.length;
    for (; Xe--; ) {
      const rt = F[Xe], {
        name: Ie,
        namespaceURI: ht,
        value: yt
      } = rt, Dn = Ue(Ie), hs = yt;
      let mt = Ie === "value" ? hs : xd(hs);
      if (Z.attrName = Dn, Z.attrValue = mt, Z.keepAttr = !0, Z.forceKeepAttr = void 0, zt(Ce.uponSanitizeAttribute, m, Z), mt = Z.attrValue, N && (Dn === "id" || Dn === "name") && (Ut(Ie, m), mt = J + mt), y && Tt(/((--!?|])>)|<\/(style|title)/i, mt)) {
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
      p && ai([we, Ve, tt], (ei) => {
        mt = xs(mt, ei, " ");
      });
      const Qs = Ue(m.nodeName);
      if (!Yn(Qs, Dn, mt)) {
        Ut(Ie, m);
        continue;
      }
      if (B && typeof O == "object" && typeof O.getAttributeType == "function" && !ht)
        switch (O.getAttributeType(Qs, Dn)) {
          case "TrustedHTML": {
            mt = B.createHTML(mt);
            break;
          }
          case "TrustedScriptURL": {
            mt = B.createScriptURL(mt);
            break;
          }
        }
      if (mt !== hs)
        try {
          ht ? m.setAttributeNS(ht, Ie, mt) : m.setAttribute(Ie, mt), Gn(m) ? Nt(m) : Ma(t.removed);
        } catch {
          Ut(Ie, m);
        }
    }
    zt(Ce.afterSanitizeAttributes, m, null);
  }, ft = function j(m) {
    let F = null;
    const Z = Mn(m);
    for (zt(Ce.beforeSanitizeShadowDOM, m, null); F = Z.nextNode(); )
      zt(Ce.uponSanitizeShadowNode, F, null), Fn(F), Ft(F), F.content instanceof r && j(F.content);
    zt(Ce.afterSanitizeShadowDOM, m, null);
  };
  return t.sanitize = function(j) {
    let m = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, F = null, Z = null, Xe = null, rt = null;
    if (M = !j, M && (j = "<!-->"), typeof j != "string" && !Js(j))
      if (typeof j.toString == "function") {
        if (j = j.toString(), typeof j != "string")
          throw As("dirty is not a string, aborting");
      } else
        throw As("toString is not a function");
    if (!t.isSupported)
      return j;
    if (R || Nn(m), t.removed = [], typeof j == "string" && (Y = !1), Y) {
      if (j.nodeName) {
        const yt = Ue(j.nodeName);
        if (!ge[yt] || ce[yt])
          throw As("root node is forbidden and cannot be sanitized in-place");
      }
    } else if (j instanceof a)
      F = Zs("<!---->"), Z = F.ownerDocument.importNode(j, !0), Z.nodeType === Ss.element && Z.nodeName === "BODY" || Z.nodeName === "HTML" ? F = Z : F.appendChild(Z);
    else {
      if (!C && !p && !x && // eslint-disable-next-line unicorn/prefer-includes
      j.indexOf("<") === -1)
        return B && D ? B.createHTML(j) : j;
      if (F = Zs(j), !F)
        return C ? null : D ? q : "";
    }
    F && I && Nt(F.firstChild);
    const Ie = Mn(Y ? j : F);
    for (; Xe = Ie.nextNode(); )
      Fn(Xe), Ft(Xe), Xe.content instanceof r && ft(Xe.content);
    if (Y)
      return j;
    if (C) {
      if (U)
        for (rt = Ne.call(F.ownerDocument); F.firstChild; )
          rt.appendChild(F.firstChild);
      else
        rt = F;
      return (Oe.shadowroot || Oe.shadowrootmode) && (rt = et.call(s, rt, !0)), rt;
    }
    let ht = x ? F.outerHTML : F.innerHTML;
    return x && ge["!doctype"] && F.ownerDocument && F.ownerDocument.doctype && F.ownerDocument.doctype.name && Tt(wc, F.ownerDocument.doctype.name) && (ht = "<!DOCTYPE " + F.ownerDocument.doctype.name + `>
` + ht), p && ai([we, Ve, tt], (yt) => {
      ht = xs(ht, yt, " ");
    }), B && D ? B.createHTML(ht) : ht;
  }, t.setConfig = function() {
    let j = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    Nn(j), R = !0;
  }, t.clearConfig = function() {
    Gt = null, R = !1;
  }, t.isValidAttribute = function(j, m, F) {
    Gt || Nn({});
    const Z = Ue(j), Xe = Ue(m);
    return Yn(Z, Xe, F);
  }, t.addHook = function(j, m) {
    typeof m == "function" && ks(Ce[j], m);
  }, t.removeHook = function(j, m) {
    if (m !== void 0) {
      const F = bd(Ce[j], m);
      return F === -1 ? void 0 : wd(Ce[j], F, 1)[0];
    }
    return Ma(Ce[j]);
  }, t.removeHooks = function(j) {
    Ce[j] = [];
  }, t.removeAllHooks = function() {
    Ce = Ha();
  }, t;
}
var ko = kc();
ko.addHook("uponSanitizeElement", (e, t) => {
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
ko.addHook("afterSanitizeAttributes", (e) => {
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
function Bd(e) {
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
  return ko.sanitize(e, t);
}
Be.setOptions({
  renderer: new Be.Renderer(),
  gfm: !0,
  breaks: !0
});
const vi = (e) => Bd(Be(e || "")), $d = { class: "askai" }, Ud = { class: "askai__bar" }, zd = ["value", "placeholder", "disabled", "aria-label", "onKeydown"], Hd = { class: "askai__intro" }, qd = { class: "askai__title" }, Wd = {
  key: 0,
  class: "askai__subtitle"
}, jd = {
  key: 0,
  class: "askai__suggestions"
}, Vd = ["disabled", "onClick"], Kd = {
  key: 0,
  class: "askai__question"
}, Gd = {
  key: 1,
  class: "askai__system"
}, Yd = ["innerHTML"], Xd = {
  key: 0,
  class: "askai__sources"
}, Zd = ["title"], Jd = {
  key: 0,
  class: "askai__thinking",
  role: "status",
  "aria-live": "polite"
}, Qd = { class: "askai__thinking-text" }, ep = { class: "askai__foot" }, tp = { key: 0 }, np = /* @__PURE__ */ Ll({
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
    citationTooltip: { type: Function }
  },
  emits: ["update:draft", "send", "ask", "close"],
  setup(e, { emit: t }) {
    const n = e, s = t, i = ue(null), r = ue(null), o = ["user", "bot", "agent", "system"], a = pe(() => n.messages.filter((W) => o.includes(W.message_type))), l = pe(() => a.value.length > 0), h = (W) => {
      s("update:draft", W.target.value);
    }, c = () => {
      !n.inputEnabled || !n.draft.trim() || s("send");
    }, w = (W) => {
      n.inputEnabled && s("ask", W);
    }, _ = typeof navigator < "u" && /Mac|iPod|iPhone|iPad/.test(navigator.platform || ""), O = (W) => {
      if (W.key === "Escape") {
        W.preventDefault(), s("close");
        return;
      }
      const K = _ ? W.metaKey && !W.ctrlKey : W.ctrlKey && !W.metaKey;
      n.hotkey && K && !W.altKey && (W.key === "k" || W.key === "K") && (W.preventDefault(), s("close"));
    }, P = () => {
      os(() => {
        var W;
        return (W = i.value) == null ? void 0 : W.focus();
      });
    }, V = pe(() => a.value.reduce((W, K) => {
      var le;
      return W + (((le = K.message) == null ? void 0 : le.length) || 0);
    }, 0));
    return Qt(
      () => [a.value.length, V.value, n.loading],
      () => os(() => {
        r.value && (r.value.scrollTop = r.value.scrollHeight);
      })
    ), Qt(() => n.active, (W) => {
      W && P();
    }), Wi(() => {
      n.active && P(), window.addEventListener("keydown", O);
    }), Ml(() => {
      window.removeEventListener("keydown", O);
    }), (W, K) => (k(), A("div", $d, [
      b("div", Ud, [
        K[2] || (K[2] = b("svg", {
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
          value: W.draft,
          placeholder: W.placeholder,
          disabled: !W.inputEnabled,
          "aria-label": W.placeholder,
          autocomplete: "off",
          spellcheck: "false",
          onInput: h,
          onKeydown: mi(qn(c, ["prevent"]), ["enter"])
        }, null, 40, zd),
        b("button", {
          type: "button",
          class: "askai__close",
          "aria-label": "Close",
          title: "Close (Esc)",
          onClick: K[0] || (K[0] = (le) => s("close"))
        }, K[1] || (K[1] = [
          b("span", { class: "askai__kbd" }, "Esc", -1)
        ]))
      ]),
      b("div", {
        ref_key: "bodyEl",
        ref: r,
        class: "askai__body"
      }, [
        l.value ? (k(), A(De, { key: 1 }, [
          (k(!0), A(De, null, vt(a.value, (le, be) => (k(), A("div", {
            key: be,
            class: "askai__turn",
            "aria-live": "polite"
          }, [
            le.message_type === "user" ? (k(), A("p", Kd, se(le.message), 1)) : le.message_type === "system" ? (k(), A("p", Gd, se(le.message), 1)) : (k(), A(De, { key: 2 }, [
              b("div", {
                class: "askai__answer",
                innerHTML: S(vi)(le.message || "")
              }, null, 8, Yd),
              W.showCitations && le.sources && le.sources.length ? (k(), A("div", Xd, [
                K[5] || (K[5] = b("span", { class: "askai__label" }, "Sources", -1)),
                (k(!0), A(De, null, vt(le.sources, (B, q) => (k(), A("span", {
                  key: q,
                  class: "askai__source",
                  title: W.citationTooltip(B)
                }, se(W.citationLabel(B)), 9, Zd))), 128))
              ])) : ae("", !0)
            ], 64))
          ]))), 128)),
          W.loading ? (k(), A("div", Jd, [
            K[6] || (K[6] = b("span", { class: "askai__dot" }, null, -1)),
            K[7] || (K[7] = b("span", { class: "askai__dot" }, null, -1)),
            K[8] || (K[8] = b("span", { class: "askai__dot" }, null, -1)),
            b("span", Qd, se(W.showCitations ? "Searching the knowledge base" : "Thinking"), 1)
          ])) : ae("", !0)
        ], 64)) : (k(), A(De, { key: 0 }, [
          b("div", Hd, [
            b("h2", qd, se(W.welcomeTitle || `Ask ${W.agentName}`), 1),
            W.welcomeSubtitle ? (k(), A("p", Wd, se(W.welcomeSubtitle), 1)) : ae("", !0)
          ]),
          W.suggestions.length && !W.draft.trim() ? (k(), A("div", jd, [
            K[4] || (K[4] = b("p", { class: "askai__label" }, "Suggested", -1)),
            (k(!0), A(De, null, vt(W.suggestions, (le) => (k(), A("button", {
              key: le,
              type: "button",
              class: "askai__suggestion",
              disabled: !W.inputEnabled,
              onClick: (be) => w(le)
            }, [
              b("span", null, se(le), 1),
              K[3] || (K[3] = b("svg", {
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
            ], 8, Vd))), 128))
          ])) : ae("", !0)
        ], 64))
      ], 512),
      b("div", ep, [
        W.disclaimer ? (k(), A("span", tp, se(W.disclaimer), 1)) : ae("", !0),
        K[9] || (K[9] = b("a", {
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
}, sp = /* @__PURE__ */ xc(np, [["__scopeId", "data-v-ce776044"]]), Is = [
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
], ip = (e) => (e || "").split("").reduce((t, n) => t + n.charCodeAt(0), 0) % Is.length, rp = (e) => {
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
}, op = (e, t) => {
  const n = typeof t == "number" && Number.isFinite(t) ? t : ip(e);
  return rp(n);
}, qa = (e) => {
  var t;
  return !!((t = e == null ? void 0 : e.attributes) != null && t.end_chat);
}, Wa = "AI can make mistakes. Check important info.";
function ap(e, t = !1) {
  return e !== !1 && !t;
}
const Ac = (e) => !!e && (/^https?:\/\//i.test(e) || e.startsWith("data:")), lp = (e, t) => e ? Ac(e) || e.startsWith("blob:") ? e : `${t.replace(/\/api\/v1\/?$/, "")}${e.startsWith("/") ? "" : "/"}${e}` : "";
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
function Mi(e) {
  return lp(e, js.API_URL);
}
function cp(e) {
  const t = pe(() => ({
    backgroundColor: "var(--cm-card)",
    color: "var(--cm-text)"
  })), n = pe(() => ({
    backgroundColor: e.value.chat_bubble_color || "#C9F24E",
    color: ls(e.value.chat_bubble_color || "#C9F24E") ? "#FFFFFF" : "#000000"
  })), s = pe(() => ({
    backgroundColor: "var(--cm-agent-bg)",
    color: "var(--cm-text)"
  })), i = pe(() => ({
    backgroundColor: "var(--cm-accent)",
    color: "var(--cm-on-accent)"
  })), r = pe(() => ({
    color: "var(--cm-text)"
  })), o = pe(() => ({
    borderBottom: "1px solid var(--cm-hairline)"
  })), a = pe(() => Mi(e.value.photo_url)), l = pe(() => {
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
const up = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]), fp = /* @__PURE__ */ new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);
[...up, ...fp];
function hp(e, t) {
  const n = ue([]), s = ue(!1), i = ue(null), r = (q) => {
    if (q === 0) return "0 Bytes";
    const oe = 1024, ee = ["Bytes", "KB", "MB", "GB"], Ne = Math.floor(Math.log(q) / Math.log(oe));
    return parseFloat((q / Math.pow(oe, Ne)).toFixed(2)) + " " + ee[Ne];
  }, o = (q) => q.startsWith("image/"), a = (q) => q ? Mi(q) : "", l = (q) => {
    const oe = q.file_url || q.url;
    return oe ? Mi(oe) : "";
  }, h = async (q) => {
    const oe = q.target;
    oe.files && oe.files.length > 0 && (await V(Array.from(oe.files)), oe.value = "");
  }, c = async (q) => {
    var ee;
    q.preventDefault();
    const oe = (ee = q.dataTransfer) == null ? void 0 : ee.files;
    oe && oe.length > 0 && await V(Array.from(oe));
  }, w = (q) => {
    q.preventDefault();
  }, _ = (q) => {
    q.preventDefault();
  }, O = async (q) => {
    var Ne;
    const oe = (Ne = q.clipboardData) == null ? void 0 : Ne.items;
    if (!oe) return;
    const ee = [];
    for (const it of Array.from(oe))
      if (it.kind === "file") {
        const et = it.getAsFile();
        et && ee.push(et);
      }
    ee.length > 0 && await V(ee);
  }, P = async (q, oe = 500) => new Promise((ee, Ne) => {
    const it = new FileReader();
    it.onload = (et) => {
      var we;
      const Ce = new Image();
      Ce.onload = () => {
        const Ve = document.createElement("canvas");
        let tt = Ce.width, lt = Ce.height;
        const fe = 1920;
        (tt > fe || lt > fe) && (tt > lt ? (lt = lt / tt * fe, tt = fe) : (tt = tt / lt * fe, lt = fe)), Ve.width = tt, Ve.height = lt;
        const _e = Ve.getContext("2d");
        if (!_e) {
          Ne(new Error("Failed to get canvas context"));
          return;
        }
        _e.drawImage(Ce, 0, 0, tt, lt);
        let te = 0.9;
        const ot = () => {
          Ve.toBlob((Re) => {
            if (!Re) {
              Ne(new Error("Failed to compress image"));
              return;
            }
            if (Re.size / 1024 > oe && te > 0.3)
              te -= 0.1, ot();
            else {
              const Ke = new FileReader();
              Ke.onload = () => {
                const Oe = Ke.result.split(",")[1];
                ee({ blob: Re, base64: Oe });
              }, Ke.readAsDataURL(Re);
            }
          }, q.type === "image/png" ? "image/png" : "image/jpeg", te);
        };
        ot();
      }, Ce.onerror = () => Ne(new Error("Failed to load image")), Ce.src = (we = et.target) == null ? void 0 : we.result;
    }, it.onerror = () => Ne(new Error("Failed to read file")), it.readAsDataURL(q);
  }), V = async (q) => {
    if (n.value.length >= 3) {
      alert("Maximum 3 files allowed per message");
      return;
    }
    const et = 3 - n.value.length, Ce = q.slice(0, et);
    q.length > et && alert(`Only ${et} more file(s) can be uploaded. Maximum 3 files per message.`);
    for (const we of Ce)
      try {
        if (n.value.some((fe) => fe.filename === we.name)) {
          console.warn(`File ${we.name} is already selected`), alert(`File "${we.name}" is already selected`);
          continue;
        }
        const tt = we.type.startsWith("image/"), lt = tt ? 5242880 : 10485760;
        if (we.size > lt) {
          const fe = lt / 1048576;
          console.error(`File ${we.name} is too large. Maximum size is ${fe}MB`), alert(`File "${we.name}" is too large. Maximum size for ${tt ? "images" : "documents"} is ${fe}MB`);
          continue;
        }
        if (tt)
          try {
            const { blob: fe, base64: _e } = await P(we, 500), te = fe.size;
            console.log(`Compressed ${we.name}: ${(we.size / 1024).toFixed(2)}KB → ${(te / 1024).toFixed(2)}KB`), n.value.push({
              content: _e,
              filename: we.name,
              type: we.type,
              size: te,
              url: URL.createObjectURL(fe),
              file_url: URL.createObjectURL(fe)
            });
          } catch (fe) {
            console.error("Image compression failed, uploading original:", fe);
            const _e = new FileReader();
            _e.onload = (te) => {
              var ge;
              const Re = ((ge = te.target) == null ? void 0 : ge.result).split(",")[1];
              n.value.push({
                content: Re,
                filename: we.name,
                type: we.type,
                size: we.size,
                url: URL.createObjectURL(we),
                file_url: URL.createObjectURL(we)
              });
            }, _e.readAsDataURL(we);
          }
        else {
          const fe = new FileReader();
          fe.onload = (_e) => {
            var Re;
            const ot = ((Re = _e.target) == null ? void 0 : Re.result).split(",")[1];
            n.value.push({
              content: ot,
              filename: we.name,
              type: we.type || "application/octet-stream",
              size: we.size,
              url: "",
              file_url: ""
            });
          }, fe.readAsDataURL(we);
        }
      } catch (Ve) {
        console.error("File upload error:", Ve);
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
    handlePaste: O,
    uploadFiles: V,
    removeAttachment: async (q) => {
      const oe = n.value[q];
      if (oe) {
        try {
          let ee = oe.url;
          if (ee.startsWith("/uploads/") ? ee = ee.substring(9) : ee.startsWith("/") && (ee = ee.substring(1)), Ac(ee))
            try {
              ee = new URL(ee).pathname.replace(/^\/+/, "");
            } catch {
            }
          const Ne = {};
          e.value && (Ne.Authorization = `Bearer ${e.value}`);
          const it = await fetch(`${js.API_URL}/files/upload/${ee}`, {
            method: "DELETE",
            headers: Ne
          });
          if (it.ok)
            console.log("File deleted successfully from backend.");
          else {
            const et = await it.json();
            console.error("Failed to delete file:", et.detail);
          }
        } catch (ee) {
          console.error("Error calling delete API:", ee);
        }
        oe.url && oe.url.startsWith("blob:") && URL.revokeObjectURL(oe.url), oe.file_url && oe.file_url.startsWith("blob:") && URL.revokeObjectURL(oe.file_url), n.value.splice(q, 1);
      }
    },
    openPreview: (q) => {
      i.value = q, s.value = !0;
    },
    closePreview: () => {
      s.value = !1, setTimeout(() => {
        i.value = null;
      }, 300);
    },
    openFilePicker: () => {
      var q;
      (q = t.value) == null || q.click();
    },
    isImage: (q) => q.startsWith("image/")
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
const bi = /* @__PURE__ */ Object.create(null);
Object.keys(fn).forEach((e) => {
  bi[fn[e]] = e;
});
const Wr = { type: "error", data: "parser error" }, Tc = typeof Blob == "function" || typeof Blob < "u" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]", Sc = typeof ArrayBuffer == "function", Ec = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e && e.buffer instanceof ArrayBuffer, xo = ({ type: e, data: t }, n, s) => Tc && t instanceof Blob ? n ? s(t) : Va(t, s) : Sc && (t instanceof ArrayBuffer || Ec(t)) ? n ? s(t) : Va(new Blob([t]), s) : s(fn[e] + (t || "")), Va = (e, t) => {
  const n = new FileReader();
  return n.onload = function() {
    const s = n.result.split(",")[1];
    t("b" + (s || ""));
  }, n.readAsDataURL(e);
};
function Ka(e) {
  return e instanceof Uint8Array ? e : e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
}
let kr;
function dp(e, t) {
  if (Tc && e.data instanceof Blob)
    return e.data.arrayBuffer().then(Ka).then(t);
  if (Sc && (e.data instanceof ArrayBuffer || Ec(e.data)))
    return t(Ka(e.data));
  xo(e, !1, (n) => {
    kr || (kr = new TextEncoder()), t(kr.encode(n));
  });
}
const Ga = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", Ls = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (let e = 0; e < Ga.length; e++)
  Ls[Ga.charCodeAt(e)] = e;
const pp = (e) => {
  let t = e.length * 0.75, n = e.length, s, i = 0, r, o, a, l;
  e[e.length - 1] === "=" && (t--, e[e.length - 2] === "=" && t--);
  const h = new ArrayBuffer(t), c = new Uint8Array(h);
  for (s = 0; s < n; s += 4)
    r = Ls[e.charCodeAt(s)], o = Ls[e.charCodeAt(s + 1)], a = Ls[e.charCodeAt(s + 2)], l = Ls[e.charCodeAt(s + 3)], c[i++] = r << 2 | o >> 4, c[i++] = (o & 15) << 4 | a >> 2, c[i++] = (a & 3) << 6 | l & 63;
  return h;
}, gp = typeof ArrayBuffer == "function", Ao = (e, t) => {
  if (typeof e != "string")
    return {
      type: "message",
      data: Cc(e, t)
    };
  const n = e.charAt(0);
  return n === "b" ? {
    type: "message",
    data: mp(e.substring(1), t)
  } : bi[n] ? e.length > 1 ? {
    type: bi[n],
    data: e.substring(1)
  } : {
    type: bi[n]
  } : Wr;
}, mp = (e, t) => {
  if (gp) {
    const n = pp(e);
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
}, Rc = "", _p = (e, t) => {
  const n = e.length, s = new Array(n);
  let i = 0;
  e.forEach((r, o) => {
    xo(r, !1, (a) => {
      s[o] = a, ++i === n && t(s.join(Rc));
    });
  });
}, yp = (e, t) => {
  const n = e.split(Rc), s = [];
  for (let i = 0; i < n.length; i++) {
    const r = Ao(n[i], t);
    if (s.push(r), r.type === "error")
      break;
  }
  return s;
};
function vp() {
  return new TransformStream({
    transform(e, t) {
      dp(e, (n) => {
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
let xr;
function ci(e) {
  return e.reduce((t, n) => t + n.length, 0);
}
function ui(e, t) {
  if (e[0].length === t)
    return e.shift();
  const n = new Uint8Array(t);
  let s = 0;
  for (let i = 0; i < t; i++)
    n[i] = e[0][s++], s === e[0].length && (e.shift(), s = 0);
  return e.length && s < e[0].length && (e[0] = e[0].slice(s)), n;
}
function bp(e, t) {
  xr || (xr = new TextDecoder());
  const n = [];
  let s = 0, i = -1, r = !1;
  return new TransformStream({
    transform(o, a) {
      for (n.push(o); ; ) {
        if (s === 0) {
          if (ci(n) < 1)
            break;
          const l = ui(n, 1);
          r = (l[0] & 128) === 128, i = l[0] & 127, i < 126 ? s = 3 : i === 126 ? s = 1 : s = 2;
        } else if (s === 1) {
          if (ci(n) < 2)
            break;
          const l = ui(n, 2);
          i = new DataView(l.buffer, l.byteOffset, l.length).getUint16(0), s = 3;
        } else if (s === 2) {
          if (ci(n) < 8)
            break;
          const l = ui(n, 8), h = new DataView(l.buffer, l.byteOffset, l.length), c = h.getUint32(0);
          if (c > Math.pow(2, 21) - 1) {
            a.enqueue(Wr);
            break;
          }
          i = c * Math.pow(2, 32) + h.getUint32(4), s = 3;
        } else {
          if (ci(n) < i)
            break;
          const l = ui(n, i);
          a.enqueue(Ao(r ? l : xr.decode(l), t)), s = 0;
        }
        if (i === 0 || i > e) {
          a.enqueue(Wr);
          break;
        }
      }
    }
  });
}
const Ic = 4;
function dt(e) {
  if (e) return wp(e);
}
function wp(e) {
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
const Xi = typeof Promise == "function" && typeof Promise.resolve == "function" ? (t) => Promise.resolve().then(t) : (t, n) => n(t, 0), qt = typeof self < "u" ? self : typeof window < "u" ? window : Function("return this")(), kp = "arraybuffer";
function Lc(e, ...t) {
  return t.reduce((n, s) => (e.hasOwnProperty(s) && (n[s] = e[s]), n), {});
}
const xp = qt.setTimeout, Ap = qt.clearTimeout;
function Zi(e, t) {
  t.useNativeTimers ? (e.setTimeoutFn = xp.bind(qt), e.clearTimeoutFn = Ap.bind(qt)) : (e.setTimeoutFn = qt.setTimeout.bind(qt), e.clearTimeoutFn = qt.clearTimeout.bind(qt));
}
const Tp = 1.33;
function Sp(e) {
  return typeof e == "string" ? Ep(e) : Math.ceil((e.byteLength || e.size) * Tp);
}
function Ep(e) {
  let t = 0, n = 0;
  for (let s = 0, i = e.length; s < i; s++)
    t = e.charCodeAt(s), t < 128 ? n += 1 : t < 2048 ? n += 2 : t < 55296 || t >= 57344 ? n += 3 : (s++, n += 4);
  return n;
}
function Oc() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
function Cp(e) {
  let t = "";
  for (let n in e)
    e.hasOwnProperty(n) && (t.length && (t += "&"), t += encodeURIComponent(n) + "=" + encodeURIComponent(e[n]));
  return t;
}
function Rp(e) {
  let t = {}, n = e.split("&");
  for (let s = 0, i = n.length; s < i; s++) {
    let r = n[s].split("=");
    t[decodeURIComponent(r[0])] = decodeURIComponent(r[1]);
  }
  return t;
}
class Ip extends Error {
  constructor(t, n, s) {
    super(t), this.description = n, this.context = s, this.type = "TransportError";
  }
}
class To extends dt {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} opts - options
   * @protected
   */
  constructor(t) {
    super(), this.writable = !1, Zi(this, t), this.opts = t, this.query = t.query, this.socket = t.socket, this.supportsBinary = !t.forceBase64;
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
    return super.emitReserved("error", new Ip(t, n, s)), this;
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
    const n = Ao(t, this.socket.binaryType);
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
    const n = Cp(t);
    return n.length ? "?" + n : "";
  }
}
class Lp extends To {
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
    yp(t, this.socket.binaryType).forEach(n), this.readyState !== "closed" && (this._polling = !1, this.emitReserved("pollComplete"), this.readyState === "open" && this._poll());
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
    this.writable = !1, _p(t, (n) => {
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
const Op = Pc;
function Pp() {
}
class Np extends Lp {
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
    super(), this.createRequest = t, Zi(this, s), this._opts = s, this._method = s.method || "GET", this._uri = n, this._data = s.data !== void 0 ? s.data : null, this._create();
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
      if (this._xhr.onreadystatechange = Pp, t)
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
const Mp = function() {
  const e = Nc({
    xdomain: !1
  });
  return e && e.responseType !== null;
}();
class Fp extends Np {
  constructor(t) {
    super(t);
    const n = t && t.forceBase64;
    this.supportsBinary = Mp && !n;
  }
  request(t = {}) {
    return Object.assign(t, { xd: this.xd }, this.opts), new cn(Nc, this.uri(), t);
  }
}
function Nc(e) {
  const t = e.xdomain;
  try {
    if (typeof XMLHttpRequest < "u" && (!t || Op))
      return new XMLHttpRequest();
  } catch {
  }
  if (!t)
    try {
      return new qt[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch {
    }
}
const Mc = typeof navigator < "u" && typeof navigator.product == "string" && navigator.product.toLowerCase() === "reactnative";
class Dp extends To {
  get name() {
    return "websocket";
  }
  doOpen() {
    const t = this.uri(), n = this.opts.protocols, s = Mc ? {} : Lc(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
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
      xo(s, this.supportsBinary, (r) => {
        try {
          this.doWrite(s, r);
        } catch {
        }
        i && Xi(() => {
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
const Ar = qt.WebSocket || qt.MozWebSocket;
class Bp extends Dp {
  createSocket(t, n, s) {
    return Mc ? new Ar(t, n, s) : n ? new Ar(t, n) : new Ar(t);
  }
  doWrite(t, n) {
    this.ws.send(n);
  }
}
class $p extends To {
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
        const n = bp(Number.MAX_SAFE_INTEGER, this.socket.binaryType), s = t.readable.pipeThrough(n).getReader(), i = vp();
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
        i && Xi(() => {
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
const Up = {
  websocket: Bp,
  webtransport: $p,
  polling: Fp
}, zp = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, Hp = [
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
function jr(e) {
  if (e.length > 8e3)
    throw "URI too long";
  const t = e, n = e.indexOf("["), s = e.indexOf("]");
  n != -1 && s != -1 && (e = e.substring(0, n) + e.substring(n, s).replace(/:/g, ";") + e.substring(s, e.length));
  let i = zp.exec(e || ""), r = {}, o = 14;
  for (; o--; )
    r[Hp[o]] = i[o] || "";
  return n != -1 && s != -1 && (r.source = t, r.host = r.host.substring(1, r.host.length - 1).replace(/;/g, ":"), r.authority = r.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), r.ipv6uri = !0), r.pathNames = qp(r, r.path), r.queryKey = Wp(r, r.query), r;
}
function qp(e, t) {
  const n = /\/{2,9}/g, s = t.replace(n, "/").split("/");
  return (t.slice(0, 1) == "/" || t.length === 0) && s.splice(0, 1), t.slice(-1) == "/" && s.splice(s.length - 1, 1), s;
}
function Wp(e, t) {
  const n = {};
  return t.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(s, i, r) {
    i && (n[i] = r);
  }), n;
}
const Vr = typeof addEventListener == "function" && typeof removeEventListener == "function", wi = [];
Vr && addEventListener("offline", () => {
  wi.forEach((e) => e());
}, !1);
class Cn extends dt {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri - uri or options
   * @param {Object} opts - options
   */
  constructor(t, n) {
    if (super(), this.binaryType = kp, this.writeBuffer = [], this._prevBufferLen = 0, this._pingInterval = -1, this._pingTimeout = -1, this._maxPayload = -1, this._pingTimeoutTime = 1 / 0, t && typeof t == "object" && (n = t, t = null), t) {
      const s = jr(t);
      n.hostname = s.host, n.secure = s.protocol === "https" || s.protocol === "wss", n.port = s.port, s.query && (n.query = s.query);
    } else n.host && (n.hostname = jr(n.host).host);
    Zi(this, n), this.secure = n.secure != null ? n.secure : typeof location < "u" && location.protocol === "https:", n.hostname && !n.port && (n.port = this.secure ? "443" : "80"), this.hostname = n.hostname || (typeof location < "u" ? location.hostname : "localhost"), this.port = n.port || (typeof location < "u" && location.port ? location.port : this.secure ? "443" : "80"), this.transports = [], this._transportsByName = {}, n.transports.forEach((s) => {
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
    }, n), this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : ""), typeof this.opts.query == "string" && (this.opts.query = Rp(this.opts.query)), Vr && (this.opts.closeOnBeforeunload && (this._beforeunloadEventListener = () => {
      this.transport && (this.transport.removeAllListeners(), this.transport.close());
    }, addEventListener("beforeunload", this._beforeunloadEventListener, !1)), this.hostname !== "localhost" && (this._offlineEventListener = () => {
      this._onClose("transport close", {
        description: "network connection lost"
      });
    }, wi.push(this._offlineEventListener))), this.opts.withCredentials && (this._cookieJar = void 0), this._open();
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
      if (i && (n += Sp(i)), s > 0 && n > this._maxPayload)
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
    return t && (this._pingTimeoutTime = 0, Xi(() => {
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
      if (this.clearTimeoutFn(this._pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), Vr && (this._beforeunloadEventListener && removeEventListener("beforeunload", this._beforeunloadEventListener, !1), this._offlineEventListener)) {
        const s = wi.indexOf(this._offlineEventListener);
        s !== -1 && wi.splice(s, 1);
      }
      this.readyState = "closed", this.id = null, this.emitReserved("close", t, n), this.writeBuffer = [], this._prevBufferLen = 0;
    }
  }
}
Cn.protocol = Ic;
class jp extends Cn {
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
let Vp = class extends jp {
  constructor(t, n = {}) {
    const s = typeof t == "object" ? t : n;
    (!s.transports || s.transports && typeof s.transports[0] == "string") && (s.transports = (s.transports || ["polling", "websocket", "webtransport"]).map((i) => Up[i]).filter((i) => !!i)), super(t, s);
  }
};
function Kp(e, t = "", n) {
  let s = e;
  n = n || typeof location < "u" && location, e == null && (e = n.protocol + "//" + n.host), typeof e == "string" && (e.charAt(0) === "/" && (e.charAt(1) === "/" ? e = n.protocol + e : e = n.host + e), /^(https?|wss?):\/\//.test(e) || (typeof n < "u" ? e = n.protocol + "//" + e : e = "https://" + e), s = jr(e)), s.port || (/^(http|ws)$/.test(s.protocol) ? s.port = "80" : /^(http|ws)s$/.test(s.protocol) && (s.port = "443")), s.path = s.path || "/";
  const r = s.host.indexOf(":") !== -1 ? "[" + s.host + "]" : s.host;
  return s.id = s.protocol + "://" + r + ":" + s.port + t, s.href = s.protocol + "://" + r + (n && n.port === s.port ? "" : ":" + s.port), s;
}
const Gp = typeof ArrayBuffer == "function", Yp = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e.buffer instanceof ArrayBuffer, Fc = Object.prototype.toString, Xp = typeof Blob == "function" || typeof Blob < "u" && Fc.call(Blob) === "[object BlobConstructor]", Zp = typeof File == "function" || typeof File < "u" && Fc.call(File) === "[object FileConstructor]";
function So(e) {
  return Gp && (e instanceof ArrayBuffer || Yp(e)) || Xp && e instanceof Blob || Zp && e instanceof File;
}
function ki(e, t) {
  if (!e || typeof e != "object")
    return !1;
  if (Array.isArray(e)) {
    for (let n = 0, s = e.length; n < s; n++)
      if (ki(e[n]))
        return !0;
    return !1;
  }
  if (So(e))
    return !0;
  if (e.toJSON && typeof e.toJSON == "function" && arguments.length === 1)
    return ki(e.toJSON(), !0);
  for (const n in e)
    if (Object.prototype.hasOwnProperty.call(e, n) && ki(e[n]))
      return !0;
  return !1;
}
function Jp(e) {
  const t = [], n = e.data, s = e;
  return s.data = Kr(n, t), s.attachments = t.length, { packet: s, buffers: t };
}
function Kr(e, t) {
  if (!e)
    return e;
  if (So(e)) {
    const n = { _placeholder: !0, num: t.length };
    return t.push(e), n;
  } else if (Array.isArray(e)) {
    const n = new Array(e.length);
    for (let s = 0; s < e.length; s++)
      n[s] = Kr(e[s], t);
    return n;
  } else if (typeof e == "object" && !(e instanceof Date)) {
    const n = {};
    for (const s in e)
      Object.prototype.hasOwnProperty.call(e, s) && (n[s] = Kr(e[s], t));
    return n;
  }
  return e;
}
function Qp(e, t) {
  return e.data = Gr(e.data, t), delete e.attachments, e;
}
function Gr(e, t) {
  if (!e)
    return e;
  if (e && e._placeholder === !0) {
    if (typeof e.num == "number" && e.num >= 0 && e.num < t.length)
      return t[e.num];
    throw new Error("illegal attachments");
  } else if (Array.isArray(e))
    for (let n = 0; n < e.length; n++)
      e[n] = Gr(e[n], t);
  else if (typeof e == "object")
    for (const n in e)
      Object.prototype.hasOwnProperty.call(e, n) && (e[n] = Gr(e[n], t));
  return e;
}
const eg = [
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
class tg {
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
    return (t.type === Le.EVENT || t.type === Le.ACK) && ki(t) ? this.encodeAsBinary({
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
    const n = Jp(t), s = this.encodeAsString(n.packet), i = n.buffers;
    return i.unshift(s), i;
  }
}
function Xa(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
class Eo extends dt {
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
      s || n.type === Le.BINARY_ACK ? (n.type = s ? Le.EVENT : Le.ACK, this.reconstructor = new ng(n), n.attachments === 0 && super.emitReserved("decoded", n)) : super.emitReserved("decoded", n);
    } else if (So(t) || t.base64)
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
      if (Eo.isPayloadValid(s.type, r))
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
        return Array.isArray(n) && (typeof n[0] == "number" || typeof n[0] == "string" && eg.indexOf(n[0]) === -1);
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
class ng {
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
      const n = Qp(this.reconPack, this.buffers);
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
const sg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Decoder: Eo,
  Encoder: tg,
  get PacketType() {
    return Le;
  }
}, Symbol.toStringTag, { value: "Module" }));
function Jt(e, t, n) {
  return e.on(t, n), function() {
    e.off(t, n);
  };
}
const ig = Object.freeze({
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
    if (ig.hasOwnProperty(t))
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
class Yr extends dt {
  constructor(t, n) {
    var s;
    super(), this.nsps = {}, this.subs = [], t && typeof t == "object" && (n = t, t = void 0), n = n || {}, n.path = n.path || "/socket.io", this.opts = n, Zi(this, n), this.reconnection(n.reconnection !== !1), this.reconnectionAttempts(n.reconnectionAttempts || 1 / 0), this.reconnectionDelay(n.reconnectionDelay || 1e3), this.reconnectionDelayMax(n.reconnectionDelayMax || 5e3), this.randomizationFactor((s = n.randomizationFactor) !== null && s !== void 0 ? s : 0.5), this.backoff = new us({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    }), this.timeout(n.timeout == null ? 2e4 : n.timeout), this._readyState = "closed", this.uri = t;
    const i = n.parser || sg;
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
    this.engine = new Vp(this.uri, this.opts);
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
    Xi(() => {
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
function xi(e, t) {
  typeof e == "object" && (t = e, e = void 0), t = t || {};
  const n = Kp(e, t.path || "/socket.io"), s = n.source, i = n.id, r = n.path, o = Es[i] && r in Es[i].nsps, a = t.forceNew || t["force new connection"] || t.multiplex === !1 || o;
  let l;
  return a ? l = new Yr(s, t) : (Es[i] || (Es[i] = new Yr(s, t)), l = Es[i]), n.query && !t.query && (t.query = n.queryKey), l.socket(n.path, t);
}
Object.assign(xi, {
  Manager: Yr,
  Socket: Dc,
  io: xi,
  connect: xi
});
function rg() {
  const e = ue([]), t = ue(!1), n = ue(""), s = ue(!1), i = ue(!1), r = ue(!1), o = ue("connecting"), a = ue(0), l = 5, h = ue({}), c = ue(null), w = ue("");
  let _ = null, O = null, P = null, V = null, W, K;
  const le = (H) => {
    W = H, H && localStorage.setItem("ctid", H);
  }, be = (H) => {
    K = H;
  }, B = (H) => {
    var Me;
    const ye = W || localStorage.getItem("ctid"), ce = {};
    ye && (ce.conversation_token = ye), K && (ce.widget_id = K);
    try {
      ce.page_url = window.parent !== window && ((Me = window.parent.location) != null && Me.href) ? window.parent.location.href : document.referrer || window.location.href;
    } catch {
      ce.page_url = document.referrer || "";
    }
    return _ = xi(`${js.WS_URL}/widget`, {
      transports: ["websocket"],
      reconnection: !0,
      reconnectionAttempts: l,
      reconnectionDelay: 1e3,
      auth: Object.keys(ce).length > 0 ? ce : void 0
    }), _.on("connect", () => {
      o.value = "connected", a.value = 0;
    }), _.on("disconnect", () => {
      o.value === "connected" && (console.log("Socket disconnected, setting connection status to connecting"), o.value = "connecting");
    }), _.on("connect_error", () => {
      a.value++, console.error("Socket connection failed, attempt:", a.value, "connection status:", o.value), a.value >= l && (o.value = "failed");
    }), _.on("chat_response", (G) => {
      if (t.value = !1, G.session_id ? (console.log("Captured session_id from chat_response:", G.session_id), w.value = G.session_id) : console.warn("No session_id in chat_response data:", G), G.type === "agent_message") {
        const Ge = {
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
        G.attachments && Array.isArray(G.attachments) && (Ge.id = G.message_id, Ge.attachments = G.attachments.map((ct, At) => ({
          id: G.message_id * 1e3 + At,
          filename: ct.filename,
          file_url: ct.file_url,
          content_type: ct.content_type,
          file_size: ct.file_size
        }))), e.value.push(Ge);
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
      }, O && O(G);
    }), _.on("session_initialized", (G) => {
      G.session_id && (console.log("Initialized session_id from session_initialized:", G.session_id), w.value = G.session_id);
    }), _.on("error", et), _.on("chat_history", Ce), _.on("rating_submitted", we), _.on("display_form", Ve), _.on("form_submitted", tt), _.on("workflow_state", lt), _.on("workflow_proceeded", fe), _;
  }, q = async () => {
    try {
      return o.value = "connecting", a.value = 0, _ && (_.removeAllListeners(), _.disconnect(), _ = null), _ = B(""), new Promise((H) => {
        _ == null || _.on("connect", () => {
          H(!0);
        }), _ == null || _.on("connect_error", () => {
          a.value >= l && H(!1);
        });
      });
    } catch (H) {
      return console.error("Socket initialization failed:", H), o.value = "failed", !1;
    }
  }, oe = () => (_ && _.disconnect(), q()), ee = (H) => {
    O = H;
  }, Ne = (H) => {
    P = H;
  }, it = (H) => {
    V = H;
  }, et = (H) => {
    t.value = !1, n.value = Nh(H), s.value = !0, setTimeout(() => {
      s.value = !1, n.value = "";
    }, 5e3);
  }, Ce = (H) => {
    if (H.type === "chat_history" && Array.isArray(H.messages)) {
      const ye = H.messages.map((ce) => {
        var G, Ge;
        const Me = {
          message: ce.message,
          message_type: ce.message_type,
          created_at: ce.created_at,
          session_id: "",
          agent_name: ce.agent_name || "",
          user_name: ce.user_name || "",
          attributes: ce.attributes || {},
          attachments: ce.attachments || []
          // Include attachments
        };
        return Array.isArray((G = ce.attributes) == null ? void 0 : G.sources) && ce.attributes.sources.length && (Me.sources = ce.attributes.sources), (Ge = ce.attributes) != null && Ge.shopify_output && typeof ce.attributes.shopify_output == "object" ? {
          ...Me,
          message_type: "product",
          shopify_output: ce.attributes.shopify_output
        } : Me;
      });
      e.value = [
        ...ye.filter(
          (ce) => !e.value.some(
            (Me) => Me.message === ce.message && Me.created_at === ce.created_at
          )
        ),
        ...e.value
      ];
    }
  }, we = (H) => {
    H.success && e.value.push({
      message: "Thank you for your feedback!",
      message_type: "system",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: ""
    });
  }, Ve = (H) => {
    var ye;
    console.log("Form display handler in composable:", H), t.value = !1, c.value = H.form_data, console.log("Set currentForm in handleDisplayForm:", c.value), ((ye = H.form_data) == null ? void 0 : ye.form_full_screen) === !0 ? (console.log("Full screen form detected, triggering workflow state callback"), P && P({
      type: "form",
      form_data: H.form_data,
      session_id: H.session_id
    })) : e.value.push({
      message: "",
      message_type: "form",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      session_id: H.session_id,
      attributes: {
        form_data: H.form_data
      }
    });
  }, tt = (H) => {
    console.log("Form submitted confirmation received, clearing currentForm"), c.value = null, H.success && console.log("Form submitted successfully");
  }, lt = (H) => {
    console.log("Workflow state received in composable:", H), (H.type === "form" || H.type === "display_form") && (console.log("Setting currentForm from workflow state:", H.form_data), c.value = H.form_data), P && P(H);
  }, fe = (H) => {
    console.log("Workflow proceeded in composable:", H), V && V(H);
  };
  return {
    messages: e,
    loading: t,
    errorMessage: n,
    showError: s,
    loadingHistory: i,
    hasStartedChat: r,
    connectionStatus: o,
    sendMessage: async (H, ye, ce = []) => {
      if (!_ || !H.trim() && ce.length === 0) return;
      h.value.human_agent_name || (t.value = !0);
      const Me = {
        message: H,
        message_type: "user",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: ""
      };
      ce.length > 0 && (Me.attachments = ce.map((G, Ge) => {
        let ct = "";
        if (G.content_type.startsWith("image/")) {
          const At = atob(G.content), p = new Array(At.length);
          for (let R = 0; R < At.length; R++)
            p[R] = At.charCodeAt(R);
          const y = new Uint8Array(p), x = new Blob([y], { type: G.content_type });
          ct = URL.createObjectURL(x);
        }
        return {
          id: Date.now() * 1e3 + Ge,
          // Temporary ID
          filename: G.filename,
          file_url: ct,
          // Temporary blob URL, will be replaced
          content_type: G.content_type,
          file_size: G.size,
          _isTemporary: !0
          // Flag to identify temporary attachments
        };
      })), e.value.push(Me), _.emit("chat", {
        message: H,
        email: ye,
        files: ce
        // Send files with base64 content
      }), r.value = !0;
    },
    loadChatHistory: async () => {
      if (_)
        try {
          i.value = !0, _.emit("get_chat_history");
        } catch (H) {
          console.error("Failed to load chat history:", H);
        } finally {
          i.value = !1;
        }
    },
    connect: q,
    reconnect: oe,
    cleanup: () => {
      _ && (_.removeAllListeners(), _.disconnect(), _ = null), O = null, P = null, V = null;
    },
    humanAgent: h,
    onTakeover: ee,
    submitRating: async (H, ye) => {
      !_ || !H || _.emit("submit_rating", {
        rating: H,
        feedback: ye
      });
    },
    currentForm: c,
    submitForm: async (H) => {
      var Me;
      if (console.log("Submitting form in socket:", H), console.log("Current form in socket:", c.value), console.log("Socket in socket:", _), !_) {
        console.error("No socket available for form submission");
        return;
      }
      if (!H || Object.keys(H).length === 0) {
        console.error("No form data to submit");
        return;
      }
      const ce = ((Me = c.value) == null ? void 0 : Me.form_type) === "contact" ? "submit_contact_info" : "submit_form";
      console.log(`Emitting ${ce} event with data:`, H), _.emit(ce, {
        form_data: H
      }), c.value = null;
    },
    getWorkflowState: async () => {
      _ && (console.log("Getting workflow state 12"), _.emit("get_workflow_state"));
    },
    proceedWorkflow: async () => {
      _ && _.emit("proceed_workflow", {});
    },
    onWorkflowState: Ne,
    onWorkflowProceeded: it,
    currentSessionId: w,
    setToken: le,
    setWidgetId: be
  };
}
function og(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Tr = { exports: {} }, Za;
function ag() {
  return Za || (Za = 1, function(e) {
    (function() {
      function t(f, v, E) {
        return f.call.apply(f.bind, arguments);
      }
      function n(f, v, E) {
        if (!f) throw Error();
        if (2 < arguments.length) {
          var T = Array.prototype.slice.call(arguments, 2);
          return function() {
            var M = Array.prototype.slice.call(arguments);
            return Array.prototype.unshift.apply(M, T), f.apply(v, M);
          };
        }
        return function() {
          return f.apply(v, arguments);
        };
      }
      function s(f, v, E) {
        return s = Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1 ? t : n, s.apply(null, arguments);
      }
      var i = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      function r(f, v) {
        this.a = f, this.o = v || f, this.c = this.o.document;
      }
      var o = !!window.FontFace;
      function a(f, v, E, T) {
        if (v = f.c.createElement(v), E) for (var M in E) E.hasOwnProperty(M) && (M == "style" ? v.style.cssText = E[M] : v.setAttribute(M, E[M]));
        return T && v.appendChild(f.c.createTextNode(T)), v;
      }
      function l(f, v, E) {
        f = f.c.getElementsByTagName(v)[0], f || (f = document.documentElement), f.insertBefore(E, f.lastChild);
      }
      function h(f) {
        f.parentNode && f.parentNode.removeChild(f);
      }
      function c(f, v, E) {
        v = v || [], E = E || [];
        for (var T = f.className.split(/\s+/), M = 0; M < v.length; M += 1) {
          for (var X = !1, ie = 0; ie < T.length; ie += 1) if (v[M] === T[ie]) {
            X = !0;
            break;
          }
          X || T.push(v[M]);
        }
        for (v = [], M = 0; M < T.length; M += 1) {
          for (X = !1, ie = 0; ie < E.length; ie += 1) if (T[M] === E[ie]) {
            X = !0;
            break;
          }
          X || v.push(T[M]);
        }
        f.className = v.join(" ").replace(/\s+/g, " ").replace(/^\s+|\s+$/, "");
      }
      function w(f, v) {
        for (var E = f.className.split(/\s+/), T = 0, M = E.length; T < M; T++) if (E[T] == v) return !0;
        return !1;
      }
      function _(f) {
        return f.o.location.hostname || f.a.location.hostname;
      }
      function O(f, v, E) {
        function T() {
          xe && M && X && (xe(ie), xe = null);
        }
        v = a(f, "link", { rel: "stylesheet", href: v, media: "all" });
        var M = !1, X = !0, ie = null, xe = E || null;
        o ? (v.onload = function() {
          M = !0, T();
        }, v.onerror = function() {
          M = !0, ie = Error("Stylesheet failed to load"), T();
        }) : setTimeout(function() {
          M = !0, T();
        }, 0), l(f, "head", v);
      }
      function P(f, v, E, T) {
        var M = f.c.getElementsByTagName("head")[0];
        if (M) {
          var X = a(f, "script", { src: v }), ie = !1;
          return X.onload = X.onreadystatechange = function() {
            ie || this.readyState && this.readyState != "loaded" && this.readyState != "complete" || (ie = !0, E && E(null), X.onload = X.onreadystatechange = null, X.parentNode.tagName == "HEAD" && M.removeChild(X));
          }, M.appendChild(X), setTimeout(function() {
            ie || (ie = !0, E && E(Error("Script load timeout")));
          }, T || 5e3), X;
        }
        return null;
      }
      function V() {
        this.a = 0, this.c = null;
      }
      function W(f) {
        return f.a++, function() {
          f.a--, le(f);
        };
      }
      function K(f, v) {
        f.c = v, le(f);
      }
      function le(f) {
        f.a == 0 && f.c && (f.c(), f.c = null);
      }
      function be(f) {
        this.a = f || "-";
      }
      be.prototype.c = function(f) {
        for (var v = [], E = 0; E < arguments.length; E++) v.push(arguments[E].replace(/[\W_]+/g, "").toLowerCase());
        return v.join(this.a);
      };
      function B(f, v) {
        this.c = f, this.f = 4, this.a = "n";
        var E = (v || "n4").match(/^([nio])([1-9])$/i);
        E && (this.a = E[1], this.f = parseInt(E[2], 10));
      }
      function q(f) {
        return Ne(f) + " " + (f.f + "00") + " 300px " + oe(f.c);
      }
      function oe(f) {
        var v = [];
        f = f.split(/,\s*/);
        for (var E = 0; E < f.length; E++) {
          var T = f[E].replace(/['"]/g, "");
          T.indexOf(" ") != -1 || /^\d/.test(T) ? v.push("'" + T + "'") : v.push(T);
        }
        return v.join(",");
      }
      function ee(f) {
        return f.a + f.f;
      }
      function Ne(f) {
        var v = "normal";
        return f.a === "o" ? v = "oblique" : f.a === "i" && (v = "italic"), v;
      }
      function it(f) {
        var v = 4, E = "n", T = null;
        return f && ((T = f.match(/(normal|oblique|italic)/i)) && T[1] && (E = T[1].substr(0, 1).toLowerCase()), (T = f.match(/([1-9]00|normal|bold)/i)) && T[1] && (/bold/i.test(T[1]) ? v = 7 : /[1-9]00/.test(T[1]) && (v = parseInt(T[1].substr(0, 1), 10)))), E + v;
      }
      function et(f, v) {
        this.c = f, this.f = f.o.document.documentElement, this.h = v, this.a = new be("-"), this.j = v.events !== !1, this.g = v.classes !== !1;
      }
      function Ce(f) {
        f.g && c(f.f, [f.a.c("wf", "loading")]), Ve(f, "loading");
      }
      function we(f) {
        if (f.g) {
          var v = w(f.f, f.a.c("wf", "active")), E = [], T = [f.a.c("wf", "loading")];
          v || E.push(f.a.c("wf", "inactive")), c(f.f, E, T);
        }
        Ve(f, "inactive");
      }
      function Ve(f, v, E) {
        f.j && f.h[v] && (E ? f.h[v](E.c, ee(E)) : f.h[v]());
      }
      function tt() {
        this.c = {};
      }
      function lt(f, v, E) {
        var T = [], M;
        for (M in v) if (v.hasOwnProperty(M)) {
          var X = f.c[M];
          X && T.push(X(v[M], E));
        }
        return T;
      }
      function fe(f, v) {
        this.c = f, this.f = v, this.a = a(this.c, "span", { "aria-hidden": "true" }, this.f);
      }
      function _e(f) {
        l(f.c, "body", f.a);
      }
      function te(f) {
        return "display:block;position:absolute;top:-9999px;left:-9999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:" + oe(f.c) + ";" + ("font-style:" + Ne(f) + ";font-weight:" + (f.f + "00") + ";");
      }
      function ot(f, v, E, T, M, X) {
        this.g = f, this.j = v, this.a = T, this.c = E, this.f = M || 3e3, this.h = X || void 0;
      }
      ot.prototype.start = function() {
        var f = this.c.o.document, v = this, E = i(), T = new Promise(function(ie, xe) {
          function Se() {
            i() - E >= v.f ? xe() : f.fonts.load(q(v.a), v.h).then(function(Ye) {
              1 <= Ye.length ? ie() : setTimeout(Se, 25);
            }, function() {
              xe();
            });
          }
          Se();
        }), M = null, X = new Promise(function(ie, xe) {
          M = setTimeout(xe, v.f);
        });
        Promise.race([X, T]).then(function() {
          M && (clearTimeout(M), M = null), v.g(v.a);
        }, function() {
          v.j(v.a);
        });
      };
      function Re(f, v, E, T, M, X, ie) {
        this.v = f, this.B = v, this.c = E, this.a = T, this.s = ie || "BESbswy", this.f = {}, this.w = M || 3e3, this.u = X || null, this.m = this.j = this.h = this.g = null, this.g = new fe(this.c, this.s), this.h = new fe(this.c, this.s), this.j = new fe(this.c, this.s), this.m = new fe(this.c, this.s), f = new B(this.a.c + ",serif", ee(this.a)), f = te(f), this.g.a.style.cssText = f, f = new B(this.a.c + ",sans-serif", ee(this.a)), f = te(f), this.h.a.style.cssText = f, f = new B("serif", ee(this.a)), f = te(f), this.j.a.style.cssText = f, f = new B("sans-serif", ee(this.a)), f = te(f), this.m.a.style.cssText = f, _e(this.g), _e(this.h), _e(this.j), _e(this.m);
      }
      var ge = { D: "serif", C: "sans-serif" }, Ke = null;
      function Oe() {
        if (Ke === null) {
          var f = /AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent);
          Ke = !!f && (536 > parseInt(f[1], 10) || parseInt(f[1], 10) === 536 && 11 >= parseInt(f[2], 10));
        }
        return Ke;
      }
      Re.prototype.start = function() {
        this.f.serif = this.j.a.offsetWidth, this.f["sans-serif"] = this.m.a.offsetWidth, this.A = i(), ye(this);
      };
      function H(f, v, E) {
        for (var T in ge) if (ge.hasOwnProperty(T) && v === f.f[ge[T]] && E === f.f[ge[T]]) return !0;
        return !1;
      }
      function ye(f) {
        var v = f.g.a.offsetWidth, E = f.h.a.offsetWidth, T;
        (T = v === f.f.serif && E === f.f["sans-serif"]) || (T = Oe() && H(f, v, E)), T ? i() - f.A >= f.w ? Oe() && H(f, v, E) && (f.u === null || f.u.hasOwnProperty(f.a.c)) ? Me(f, f.v) : Me(f, f.B) : ce(f) : Me(f, f.v);
      }
      function ce(f) {
        setTimeout(s(function() {
          ye(this);
        }, f), 50);
      }
      function Me(f, v) {
        setTimeout(s(function() {
          h(this.g.a), h(this.h.a), h(this.j.a), h(this.m.a), v(this.a);
        }, f), 0);
      }
      function G(f, v, E) {
        this.c = f, this.a = v, this.f = 0, this.m = this.j = !1, this.s = E;
      }
      var Ge = null;
      G.prototype.g = function(f) {
        var v = this.a;
        v.g && c(v.f, [v.a.c("wf", f.c, ee(f).toString(), "active")], [v.a.c("wf", f.c, ee(f).toString(), "loading"), v.a.c("wf", f.c, ee(f).toString(), "inactive")]), Ve(v, "fontactive", f), this.m = !0, ct(this);
      }, G.prototype.h = function(f) {
        var v = this.a;
        if (v.g) {
          var E = w(v.f, v.a.c("wf", f.c, ee(f).toString(), "active")), T = [], M = [v.a.c("wf", f.c, ee(f).toString(), "loading")];
          E || T.push(v.a.c("wf", f.c, ee(f).toString(), "inactive")), c(v.f, T, M);
        }
        Ve(v, "fontinactive", f), ct(this);
      };
      function ct(f) {
        --f.f == 0 && f.j && (f.m ? (f = f.a, f.g && c(f.f, [f.a.c("wf", "active")], [f.a.c("wf", "loading"), f.a.c("wf", "inactive")]), Ve(f, "active")) : we(f.a));
      }
      function At(f) {
        this.j = f, this.a = new tt(), this.h = 0, this.f = this.g = !0;
      }
      At.prototype.load = function(f) {
        this.c = new r(this.j, f.context || this.j), this.g = f.events !== !1, this.f = f.classes !== !1, y(this, new et(this.c, f), f);
      };
      function p(f, v, E, T, M) {
        var X = --f.h == 0;
        (f.f || f.g) && setTimeout(function() {
          var ie = M || null, xe = T || null || {};
          if (E.length === 0 && X) we(v.a);
          else {
            v.f += E.length, X && (v.j = X);
            var Se, Ye = [];
            for (Se = 0; Se < E.length; Se++) {
              var Fe = E[Se], gt = xe[Fe.c], _t = v.a, Ue = Fe;
              if (_t.g && c(_t.f, [_t.a.c("wf", Ue.c, ee(Ue).toString(), "loading")]), Ve(_t, "fontloading", Ue), _t = null, Ge === null) if (window.FontFace) {
                var Ue = /Gecko.*Firefox\/(\d+)/.exec(window.navigator.userAgent), Gt = /OS X.*Version\/10\..*Safari/.exec(window.navigator.userAgent) && /Apple/.exec(window.navigator.vendor);
                Ge = Ue ? 42 < parseInt(Ue[1], 10) : !Gt;
              } else Ge = !1;
              Ge ? _t = new ot(s(v.g, v), s(v.h, v), v.c, Fe, v.s, gt) : _t = new Re(s(v.g, v), s(v.h, v), v.c, Fe, v.s, ie, gt), Ye.push(_t);
            }
            for (Se = 0; Se < Ye.length; Se++) Ye[Se].start();
          }
        }, 0);
      }
      function y(f, v, E) {
        var M = [], T = E.timeout;
        Ce(v);
        var M = lt(f.a, E, f.c), X = new G(f.c, v, T);
        for (f.h = M.length, v = 0, E = M.length; v < E; v++) M[v].load(function(ie, xe, Se) {
          p(f, X, ie, xe, Se);
        });
      }
      function x(f, v) {
        this.c = f, this.a = v;
      }
      x.prototype.load = function(f) {
        function v() {
          if (X["__mti_fntLst" + T]) {
            var ie = X["__mti_fntLst" + T](), xe = [], Se;
            if (ie) for (var Ye = 0; Ye < ie.length; Ye++) {
              var Fe = ie[Ye].fontfamily;
              ie[Ye].fontStyle != null && ie[Ye].fontWeight != null ? (Se = ie[Ye].fontStyle + ie[Ye].fontWeight, xe.push(new B(Fe, Se))) : xe.push(new B(Fe));
            }
            f(xe);
          } else setTimeout(function() {
            v();
          }, 50);
        }
        var E = this, T = E.a.projectId, M = E.a.version;
        if (T) {
          var X = E.c.o;
          P(this.c, (E.a.api || "https://fast.fonts.net/jsapi") + "/" + T + ".js" + (M ? "?v=" + M : ""), function(ie) {
            ie ? f([]) : (X["__MonotypeConfiguration__" + T] = function() {
              return E.a;
            }, v());
          }).id = "__MonotypeAPIScript__" + T;
        } else f([]);
      };
      function R(f, v) {
        this.c = f, this.a = v;
      }
      R.prototype.load = function(f) {
        var v, E, T = this.a.urls || [], M = this.a.families || [], X = this.a.testStrings || {}, ie = new V();
        for (v = 0, E = T.length; v < E; v++) O(this.c, T[v], W(ie));
        var xe = [];
        for (v = 0, E = M.length; v < E; v++) if (T = M[v].split(":"), T[1]) for (var Se = T[1].split(","), Ye = 0; Ye < Se.length; Ye += 1) xe.push(new B(T[0], Se[Ye]));
        else xe.push(new B(T[0]));
        K(ie, function() {
          f(xe, X);
        });
      };
      function I(f, v) {
        f ? this.c = f : this.c = C, this.a = [], this.f = [], this.g = v || "";
      }
      var C = "https://fonts.googleapis.com/css";
      function U(f, v) {
        for (var E = v.length, T = 0; T < E; T++) {
          var M = v[T].split(":");
          M.length == 3 && f.f.push(M.pop());
          var X = "";
          M.length == 2 && M[1] != "" && (X = ":"), f.a.push(M.join(X));
        }
      }
      function D(f) {
        if (f.a.length == 0) throw Error("No fonts to load!");
        if (f.c.indexOf("kit=") != -1) return f.c;
        for (var v = f.a.length, E = [], T = 0; T < v; T++) E.push(f.a[T].replace(/ /g, "+"));
        return v = f.c + "?family=" + E.join("%7C"), 0 < f.f.length && (v += "&subset=" + f.f.join(",")), 0 < f.g.length && (v += "&text=" + encodeURIComponent(f.g)), v;
      }
      function $(f) {
        this.f = f, this.a = [], this.c = {};
      }
      var N = { latin: "BESbswy", "latin-ext": "çöüğş", cyrillic: "йяЖ", greek: "αβΣ", khmer: "កខគ", Hanuman: "កខគ" }, J = { thin: "1", extralight: "2", "extra-light": "2", ultralight: "2", "ultra-light": "2", light: "3", regular: "4", book: "4", medium: "5", "semi-bold": "6", semibold: "6", "demi-bold": "6", demibold: "6", bold: "7", "extra-bold": "8", extrabold: "8", "ultra-bold": "8", ultrabold: "8", black: "9", heavy: "9", l: "3", r: "4", b: "7" }, z = { i: "i", italic: "i", n: "n", normal: "n" }, Y = /^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/;
      function Q(f) {
        for (var v = f.f.length, E = 0; E < v; E++) {
          var T = f.f[E].split(":"), M = T[0].replace(/\+/g, " "), X = ["n4"];
          if (2 <= T.length) {
            var ie, xe = T[1];
            if (ie = [], xe) for (var xe = xe.split(","), Se = xe.length, Ye = 0; Ye < Se; Ye++) {
              var Fe;
              if (Fe = xe[Ye], Fe.match(/^[\w-]+$/)) {
                var gt = Y.exec(Fe.toLowerCase());
                if (gt == null) Fe = "";
                else {
                  if (Fe = gt[2], Fe = Fe == null || Fe == "" ? "n" : z[Fe], gt = gt[1], gt == null || gt == "") gt = "4";
                  else var _t = J[gt], gt = _t || (isNaN(gt) ? "4" : gt.substr(0, 1));
                  Fe = [Fe, gt].join("");
                }
              } else Fe = "";
              Fe && ie.push(Fe);
            }
            0 < ie.length && (X = ie), T.length == 3 && (T = T[2], ie = [], T = T ? T.split(",") : ie, 0 < T.length && (T = N[T[0]]) && (f.c[M] = T));
          }
          for (f.c[M] || (T = N[M]) && (f.c[M] = T), T = 0; T < X.length; T += 1) f.a.push(new B(M, X[T]));
        }
      }
      function re(f, v) {
        this.c = f, this.a = v;
      }
      var Pe = { Arimo: !0, Cousine: !0, Tinos: !0 };
      re.prototype.load = function(f) {
        var v = new V(), E = this.c, T = new I(this.a.api, this.a.text), M = this.a.families;
        U(T, M);
        var X = new $(M);
        Q(X), O(E, D(T), W(v)), K(v, function() {
          f(X.a, X.c, Pe);
        });
      };
      function he(f, v) {
        this.c = f, this.a = v;
      }
      he.prototype.load = function(f) {
        var v = this.a.id, E = this.c.o;
        v ? P(this.c, (this.a.api || "https://use.typekit.net") + "/" + v + ".js", function(T) {
          if (T) f([]);
          else if (E.Typekit && E.Typekit.config && E.Typekit.config.fn) {
            T = E.Typekit.config.fn;
            for (var M = [], X = 0; X < T.length; X += 2) for (var ie = T[X], xe = T[X + 1], Se = 0; Se < xe.length; Se++) M.push(new B(ie, xe[Se]));
            try {
              E.Typekit.load({ events: !1, classes: !1, async: !0 });
            } catch {
            }
            f(M);
          }
        }, 2e3) : f([]);
      };
      function ut(f, v) {
        this.c = f, this.f = v, this.a = [];
      }
      ut.prototype.load = function(f) {
        var v = this.f.id, E = this.c.o, T = this;
        v ? (E.__webfontfontdeckmodule__ || (E.__webfontfontdeckmodule__ = {}), E.__webfontfontdeckmodule__[v] = function(M, X) {
          for (var ie = 0, xe = X.fonts.length; ie < xe; ++ie) {
            var Se = X.fonts[ie];
            T.a.push(new B(Se.name, it("font-weight:" + Se.weight + ";font-style:" + Se.style)));
          }
          f(T.a);
        }, P(this.c, (this.f.api || "https://f.fontdeck.com/s/css/js/") + _(this.c) + "/" + v + ".js", function(M) {
          M && f([]);
        })) : f([]);
      };
      var $e = new At(window);
      $e.a.c.custom = function(f, v) {
        return new R(v, f);
      }, $e.a.c.fontdeck = function(f, v) {
        return new ut(v, f);
      }, $e.a.c.monotype = function(f, v) {
        return new x(v, f);
      }, $e.a.c.typekit = function(f, v) {
        return new he(v, f);
      }, $e.a.c.google = function(f, v) {
        return new re(v, f);
      };
      var nt = { load: s($e.load, $e) };
      e.exports ? e.exports = nt : (window.WebFont = nt, window.WebFontConfig && $e.load(window.WebFontConfig));
    })();
  }(Tr)), Tr.exports;
}
var lg = ag();
const cg = /* @__PURE__ */ og(lg), Ja = [
  "Space Grotesk:400,500,600,700",
  "Instrument Sans:400,500,600",
  "JetBrains Mono:400,500,600"
], ug = (e) => {
  const t = [...Ja], n = (e == null ? void 0 : e.split(",")[0].trim().replace(/['"]/g, "")) || "", s = Ja.some(
    (i) => i.toLowerCase().startsWith(n.toLowerCase())
  );
  n && !s && t.push(n), cg.load({
    google: { families: t },
    active: () => {
      if (!e) return;
      const i = document.querySelector(".chat-container");
      i && (i.style.fontFamily = e.includes(",") ? e : `"${e}", system-ui, sans-serif`);
    }
  });
};
function fg() {
  const e = ue({}), t = ue(""), n = (i) => {
    var r;
    e.value = i, i.photo_url && (e.value.photo_url = i.photo_url), ug(i.font_family), window.parent.postMessage({
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
const hg = 13, dg = 24;
function pg(e, t) {
  const n = zi({}), s = [];
  let i = null;
  const r = typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, o = (c) => {
    i || s.length === 0 || (i = setTimeout(a, c));
  }, a = () => {
    i = null;
    const c = s[0];
    if (c === void 0) return;
    const w = e.value[c], _ = n[c], O = (w == null ? void 0 : w.message) ?? "";
    if (!_ || !w) {
      s.shift(), o(0);
      return;
    }
    if (_.shown >= O.length) {
      _.done = !0, s.shift(), o(0);
      return;
    }
    _.shown += 1;
    const P = O[_.shown - 1];
    t == null || t(), o(P === " " ? dg : hg);
  };
  Qt(() => e.value.length, (c, w) => {
    w !== void 0 && c < w && (Object.keys(n).forEach((_) => {
      delete n[Number(_)];
    }), s.length = 0);
    for (let _ = w ?? 0; _ < c; _++) {
      const O = e.value[_];
      if (!O || !O.stream || _ in n) continue;
      const P = O.message ?? "";
      r || !P ? n[_] = { shown: P.length, done: !0 } : (n[_] = { shown: 0, done: !1 }, s.push(_));
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
function gg(e) {
  const t = ue(!0);
  let n = 0;
  const s = () => {
    window.parent.postMessage({ type: "UNREAD_COUNT", count: n }, "*");
  }, i = (r) => {
    var o;
    ((o = r == null ? void 0 : r.data) == null ? void 0 : o.type) === "WIDGET_VISIBILITY" && (t.value = !!r.data.open, t.value && n !== 0 && (n = 0, s()));
  };
  Qt(() => e.value.length, (r, o) => {
    if (r <= (o ?? 0) || t.value) return;
    const a = e.value[r - 1];
    a && (a.message_type === "bot" || a.message_type === "agent") && (n += 1, s());
  }), Wi(() => window.addEventListener("message", i)), Ks(() => window.removeEventListener("message", i));
}
const mg = {
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
}, _g = {
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
}, yg = {
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
}, vg = {
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
}, bg = {
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
}, Ai = {
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
}, wg = {
  GLASS: mg,
  AURORA: _g,
  TERMINAL: yg,
  CALM_MINT: vg,
  PLAYFUL: bg,
  SUNRISE: Ai,
  CHATBOT: Ai,
  ASK_ANYTHING: Ai
}, kg = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", Qa = "'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
function xg(e) {
  return Math.max(4, Math.round(e * 0.3));
}
function el(e) {
  const t = (e || "").replace("#", "");
  if (t.length < 6) return "#0B0C10";
  const n = parseInt(t.slice(0, 2), 16), s = parseInt(t.slice(2, 4), 16), i = parseInt(t.slice(4, 6), 16);
  return (0.299 * n + 0.587 * s + 0.114 * i) / 255 > 0.62 ? "#0B0C10" : "#FFFFFF";
}
function Ag(e) {
  return wg[e || ""] || Ai;
}
const Tg = "#212529";
function Sg(e, t) {
  const n = Ag(e), s = (t == null ? void 0 : t.chat_background_color) || "", i = /^#[0-9a-fA-F]{6}$/.test(s), r = s || n.card, o = (t == null ? void 0 : t.chat_text_color) || "", l = /^#[0-9a-fA-F]{6}$/.test(o) && o.toLowerCase() !== Tg ? o : i ? ls(s) ? "#FFFFFF" : "#111111" : n.text, h = i ? ls(s) ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)" : n.muted, c = i ? Ph(s, 20) : n.agentBg, w = (t == null ? void 0 : t.accent_color) || n.accent, _ = i ? !ls(s) : n.light, O = el(w) === "#0B0C10", P = _ === O ? h : w, V = n.mono ? kg : t != null && t.font_family ? `${t.font_family}, ${Qa}` : Qa;
  return {
    "--cm-card": r,
    "--cm-text": l,
    "--cm-muted": h,
    "--cm-agent-bg": c,
    "--cm-accent": w,
    "--cm-on-accent": el(w),
    "--cm-presence": P,
    "--cm-border": n.border,
    "--cm-glow": n.glow,
    "--cm-radius": `${n.radius}px`,
    "--cm-bubble": `${n.bubble}px`,
    "--cm-bubble-tail": `${xg(n.bubble)}px`,
    "--cm-field-radius": n.mono ? "7px" : "12px",
    "--cm-avatar-radius": n.mono ? "28%" : "50%",
    "--cm-hairline": n.light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)",
    "--cm-body-font": V
  };
}
function Eg() {
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
const Cg = {
  key: 0,
  class: "widget-unavailable-overlay"
}, Rg = {
  key: 1,
  class: "auth-error-overlay"
}, Ig = { class: "auth-error-card" }, Lg = { class: "auth-error-message" }, Og = {
  key: 0,
  class: "initializing-overlay"
}, Pg = {
  key: 0,
  class: "connecting-message"
}, Ng = {
  key: 1,
  class: "failed-message"
}, Mg = { class: "welcome-content" }, Fg = { class: "welcome-header" }, Dg = ["src", "alt"], Bg = { class: "welcome-title" }, $g = { class: "welcome-subtitle" }, Ug = { class: "welcome-input-container" }, zg = {
  key: 0,
  class: "email-input"
}, Hg = ["disabled"], qg = { class: "welcome-message-input" }, Wg = ["placeholder", "disabled"], jg = ["disabled"], Vg = {
  key: 0,
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, Kg = {
  key: 1,
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, Gg = { class: "landing-page-content" }, Yg = { class: "landing-page-header" }, Xg = { class: "landing-page-heading" }, Zg = { class: "landing-page-text" }, Jg = { class: "landing-page-actions" }, Qg = { class: "form-fullscreen-content" }, em = {
  key: 0,
  class: "form-header"
}, tm = {
  key: 0,
  class: "form-title"
}, nm = {
  key: 1,
  class: "form-description"
}, sm = { class: "form-fields" }, im = ["for"], rm = {
  key: 0,
  class: "required-indicator"
}, om = ["id", "type", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "onBlur", "autocomplete", "inputmode"], am = ["id", "placeholder", "required", "min", "max", "value", "onInput"], lm = ["id", "placeholder", "required", "minlength", "maxlength", "value", "onInput"], cm = ["id", "required", "value", "onChange"], um = { value: "" }, fm = ["value"], hm = {
  key: 4,
  class: "checkbox-field"
}, dm = ["id", "required", "checked", "onChange"], pm = { class: "checkbox-label" }, gm = {
  key: 5,
  class: "radio-group"
}, mm = ["name", "value", "required", "checked", "onChange"], _m = { class: "radio-label" }, ym = {
  key: 6,
  class: "field-error"
}, vm = { class: "form-actions" }, bm = ["disabled"], wm = {
  key: 0,
  class: "loading-spinner-inline"
}, km = { key: 1 }, xm = { class: "header-content" }, Am = ["src", "alt"], Tm = { class: "header-info" }, Sm = { class: "ask-anything-header" }, Em = ["src", "alt"], Cm = { class: "header-info" }, Rm = {
  key: 2,
  class: "loading-history"
}, Im = { class: "cm-email-gate-title" }, Lm = ["disabled"], Om = {
  key: 0,
  class: "cm-email-gate-error"
}, Pm = ["disabled"], Nm = {
  key: 0,
  class: "cm-welcome-block"
}, Mm = { class: "message agent-message cm-welcome-row" }, Fm = ["src", "alt"], Dm = {
  key: 0,
  class: "cm-msg-avatar",
  "aria-hidden": "true"
}, Bm = ["src"], $m = ["src"], Um = { class: "message-col" }, zm = {
  key: 0,
  class: "rating-content"
}, Hm = { class: "rating-prompt" }, qm = ["onMouseover", "onMouseleave", "onClick", "disabled"], Wm = {
  key: 0,
  class: "feedback-wrapper"
}, jm = { class: "feedback-section" }, Vm = ["onUpdate:modelValue", "disabled"], Km = { class: "feedback-counter" }, Gm = ["onClick", "disabled"], Ym = {
  key: 1,
  class: "submitted-feedback-wrapper"
}, Xm = { class: "submitted-feedback" }, Zm = { class: "submitted-feedback-text" }, Jm = {
  key: 2,
  class: "submitted-message"
}, Qm = {
  key: 1,
  class: "form-content"
}, e_ = {
  key: 0,
  class: "form-header"
}, t_ = {
  key: 0,
  class: "form-title"
}, n_ = {
  key: 1,
  class: "form-description"
}, s_ = { class: "form-fields" }, i_ = ["for"], r_ = {
  key: 0,
  class: "required-indicator"
}, o_ = ["id", "type", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "onBlur", "disabled", "autocomplete", "inputmode"], a_ = ["id", "placeholder", "required", "min", "max", "value", "onInput", "disabled"], l_ = ["id", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "disabled"], c_ = ["id", "required", "value", "onChange", "disabled"], u_ = { value: "" }, f_ = ["value"], h_ = {
  key: 4,
  class: "checkbox-field"
}, d_ = ["id", "checked", "onChange", "disabled"], p_ = ["for"], g_ = {
  key: 5,
  class: "radio-field"
}, m_ = ["id", "name", "value", "checked", "onChange", "disabled"], __ = ["for"], y_ = {
  key: 6,
  class: "field-error"
}, v_ = { class: "form-actions" }, b_ = ["onClick", "disabled"], w_ = {
  key: 2,
  class: "user-input-content"
}, k_ = {
  key: 0,
  class: "user-input-prompt"
}, x_ = {
  key: 1,
  class: "user-input-form"
}, A_ = ["onUpdate:modelValue", "onKeydown"], T_ = ["onClick", "disabled"], S_ = {
  key: 2,
  class: "user-input-submitted"
}, E_ = {
  key: 0,
  class: "user-input-confirmation"
}, C_ = {
  key: 3,
  class: "product-message-container"
}, R_ = ["innerHTML"], I_ = {
  key: 1,
  class: "products-carousel"
}, L_ = { class: "carousel-items" }, O_ = {
  key: 0,
  class: "product-image-compact"
}, P_ = ["src", "alt"], N_ = { class: "product-info-compact" }, M_ = { class: "product-text-area" }, F_ = { class: "product-title-compact" }, D_ = {
  key: 0,
  class: "product-variant-compact"
}, B_ = { class: "product-price-compact" }, $_ = { class: "product-actions-compact" }, U_ = ["onClick"], z_ = {
  key: 2,
  class: "no-products-message"
}, H_ = {
  key: 3,
  class: "no-products-message"
}, q_ = ["innerHTML"], W_ = ["innerHTML"], j_ = {
  key: 2,
  class: "message-attachments"
}, V_ = {
  key: 0,
  class: "attachment-image-container"
}, K_ = ["src", "alt", "onClick"], G_ = { class: "attachment-image-info" }, Y_ = ["href"], X_ = { class: "attachment-size" }, Z_ = ["href"], J_ = { class: "attachment-size" }, Q_ = {
  key: 0,
  class: "citation-chips"
}, ey = ["title"], ty = { class: "message-info" }, ny = {
  key: 0,
  class: "agent-name"
}, sy = {
  key: 4,
  class: "cm-quick-actions-bar"
}, iy = ["disabled", "onClick"], ry = {
  key: 0,
  class: "file-previews-widget"
}, oy = {
  class: "file-preview-content-widget",
  style: { cursor: "pointer" }
}, ay = ["src", "alt", "onClick"], ly = ["onClick"], cy = { class: "file-preview-info-widget" }, uy = { class: "file-preview-name-widget" }, fy = { class: "file-preview-size-widget" }, hy = ["onClick"], dy = {
  key: 1,
  class: "upload-progress-widget"
}, py = { class: "message-input" }, gy = ["placeholder", "disabled"], my = ["disabled", "title"], _y = ["disabled"], yy = {
  key: 6,
  class: "new-conversation-section"
}, vy = { class: "conversation-ended-message" }, by = {
  key: 8,
  class: "rating-dialog"
}, wy = { class: "rating-content" }, ky = { class: "star-rating" }, xy = ["onClick"], Ay = { class: "rating-actions" }, Ty = ["disabled"], Sy = {
  key: 0,
  class: "preview-modal-image-container"
}, Ey = ["src", "alt"], Cy = { class: "preview-modal-filename" }, Ry = {
  key: 3,
  class: "widget-loading"
}, Cs = "ctid", tl = 3, Iy = "image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls", Ly = /* @__PURE__ */ Ll({
  __name: "WidgetBuilder",
  props: {
    widgetId: {},
    token: {},
    initialAuthError: {}
  },
  setup(e) {
    var Ho;
    const t = e, n = pe(() => {
      var d;
      return t.widgetId || ((d = window.__INITIAL_DATA__) == null ? void 0 : d.widgetId);
    }), {
      customization: s,
      agentName: i,
      applyCustomization: r,
      initializeFromData: o
    } = fg(), { formatCurrency: a } = Eg(), {
      messages: l,
      loading: h,
      errorMessage: c,
      showError: w,
      loadingHistory: _,
      hasStartedChat: O,
      connectionStatus: P,
      sendMessage: V,
      loadChatHistory: W,
      connect: K,
      reconnect: le,
      cleanup: be,
      humanAgent: B,
      onTakeover: q,
      submitRating: oe,
      submitForm: ee,
      currentForm: Ne,
      getWorkflowState: it,
      proceedWorkflow: et,
      onWorkflowState: Ce,
      onWorkflowProceeded: we,
      currentSessionId: Ve,
      setToken: tt,
      setWidgetId: lt
    } = rg(), { displayText: fe, isStreaming: _e } = pg(l, () => os(() => Mn()));
    gg(l);
    const te = ue(""), ot = ue(!0), Re = ue(""), ge = ue(!1), Ke = (d) => {
      const g = d.target;
      te.value = g.value;
    };
    let Oe = null;
    const H = () => {
      Oe && Oe.disconnect(), Oe = new MutationObserver((g) => {
        let u = !1, ne = !1;
        g.forEach((ke) => {
          if (ke.type === "childList") {
            const de = Array.from(ke.addedNodes).some(
              (Ae) => {
                var Yt;
                return Ae.nodeType === Node.ELEMENT_NODE && (Ae.matches("input, textarea") || ((Yt = Ae.querySelector) == null ? void 0 : Yt.call(Ae, "input, textarea")));
              }
            ), je = Array.from(ke.removedNodes).some(
              (Ae) => {
                var Yt;
                return Ae.nodeType === Node.ELEMENT_NODE && (Ae.matches("input, textarea") || ((Yt = Ae.querySelector) == null ? void 0 : Yt.call(Ae, "input, textarea")));
              }
            );
            de && (ne = !0, u = !0), je && (u = !0);
          }
        }), u && (clearTimeout(H.timeoutId), H.timeoutId = setTimeout(() => {
          ce();
        }, ne ? 50 : 100));
      });
      const d = document.querySelector(".widget-container") || document.body;
      Oe.observe(d, {
        childList: !0,
        subtree: !0
      });
    };
    H.timeoutId = null;
    let ye = [];
    const ce = () => {
      Me();
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
        const ne = document.querySelectorAll(u);
        if (ne.length > 0) {
          g = Array.from(ne);
          break;
        }
      }
      g.length !== 0 && (ye = g, g.forEach((u) => {
        u.addEventListener("input", Ge, !0), u.addEventListener("keyup", Ge, !0), u.addEventListener("change", Ge, !0), u.addEventListener("keypress", ct, !0), u.addEventListener("keydown", At, !0);
      }));
    }, Me = () => {
      ye.forEach((d) => {
        d.removeEventListener("input", Ge), d.removeEventListener("keyup", Ge), d.removeEventListener("change", Ge), d.removeEventListener("keypress", ct), d.removeEventListener("keydown", At);
      }), ye = [];
    }, G = (d) => !!(d && d.closest && d.closest(".form-message, .form-fullscreen, .cm-email-gate")), Ge = (d) => {
      if (G(d.target)) return;
      const g = d.target;
      te.value = g.value;
    }, ct = (d) => {
      G(d.target) || d.key === "Enter" && !d.shiftKey && (d.preventDefault(), d.stopPropagation(), tn());
    }, At = (d) => {
      G(d.target) || d.key === "Enter" && !d.shiftKey && (d.preventDefault(), d.stopPropagation(), tn());
    }, p = (d) => {
      const g = d.target, u = document.querySelector(".header-menu-container");
      document.querySelector(".header-menu-btn");
      const ne = document.querySelector(".header-dropdown-menu");
      ne && !(u != null && u.contains(g)) && (ne.style.display = "none");
    }, y = ue(!0), x = (d) => !d || d === "undefined" || d === "null" || typeof d == "string" && d.trim() === "" ? null : d, R = ue(x(((Ho = window.__INITIAL_DATA__) == null ? void 0 : Ho.initialToken) || localStorage.getItem(Cs)));
    pe(() => !!R.value);
    const I = ue(null), C = ue(!1), U = ue(!1);
    t.initialAuthError && (I.value = t.initialAuthError, C.value = !0, y.value = !1), o();
    const D = window.__INITIAL_DATA__;
    if (D != null && D.initialToken) {
      const d = x(D.initialToken);
      d && (R.value = d, window.parent.postMessage({
        type: "TOKEN_UPDATE",
        token: d
      }, "*"), ge.value = !0);
    }
    const $ = ue(!1);
    (D == null ? void 0 : D.allowAttachments) !== void 0 && ($.value = D.allowAttachments);
    const N = ue(null), {
      chatStyles: J,
      chatIconStyles: z,
      agentBubbleStyles: Y,
      userBubbleStyles: Q,
      messageNameStyles: re,
      headerBorderStyles: Pe,
      photoUrl: he,
      shadowStyle: ut
    } = cp(s), $e = ue(null), {
      uploadedAttachments: nt,
      previewModal: f,
      previewFile: v,
      formatFileSize: E,
      isImageAttachment: T,
      getDownloadUrl: M,
      getPreviewUrl: X,
      handleFileSelect: ie,
      handleDrop: xe,
      handleDragOver: Se,
      handleDragLeave: Ye,
      handlePaste: Fe,
      removeAttachment: gt,
      openPreview: _t,
      closePreview: Ue,
      openFilePicker: Gt,
      isImage: Xs
    } = hp(R, $e);
    pe(() => l.value.some(
      (d) => d.message_type === "form" && (!d.isSubmitted || d.isSubmitted === !1)
    ));
    const $t = pe(() => {
      var d;
      return O.value && ge.value || !sr.value ? P.value === "connected" && !h.value : vs(Re.value.trim()) && P.value === "connected" && !h.value || ((d = window.__INITIAL_DATA__) == null ? void 0 : d.workflow);
    }), Nn = pe(() => P.value === "connected" ? Ht.value ? "Ask me anything..." : "Type a message..." : "Connecting..."), tn = async () => {
      if (!te.value.trim() && nt.value.length === 0) return;
      !O.value && Re.value && await Ut();
      const d = nt.value.map((u) => ({
        content: u.content,
        // base64 content
        filename: u.filename,
        content_type: u.type,
        size: u.size
      }));
      await V(te.value, Re.value, d), nt.value.forEach((u) => {
        u.url && u.url.startsWith("blob:") && URL.revokeObjectURL(u.url), u.file_url && u.file_url.startsWith("blob:") && URL.revokeObjectURL(u.file_url);
      }), te.value = "", nt.value = [];
      const g = document.querySelector('input[placeholder*="Type a message"]');
      g && (g.value = ""), setTimeout(() => {
        ce();
      }, 500);
    }, fs = (d) => {
      $t.value && (te.value = d, tn());
    }, Kn = () => {
      window.parent.postMessage({ type: "WIDGET_MINIMIZE" }, "*");
    }, Nt = (d) => {
      d.key === "Enter" && !d.shiftKey && (d.preventDefault(), d.stopPropagation(), tn());
    }, Ut = async () => {
      var d, g, u, ne;
      try {
        if (!n.value)
          return console.error("Widget ID is not available"), I.value = "Widget ID is not available. Please refresh and try again.", C.value = !0, !1;
        const ke = new URL(`${js.API_URL}/widgets/${n.value}`);
        Re.value.trim() && vs(Re.value.trim()) && ke.searchParams.append("email", Re.value.trim());
        const de = {
          Accept: "application/json",
          "Content-Type": "application/json"
        };
        R.value && (de.Authorization = `Bearer ${R.value}`);
        const je = await fetch(ke, {
          headers: de
        });
        if (je.status === 401) {
          ge.value = !1;
          try {
            const Jn = (await je.json()).detail || "";
            (Jn.includes("generate-token") || Jn.includes("API key") || Jn.includes("Token required")) && (U.value = !0, I.value = "Widget authentication not configured. Please contact the website administrator.", C.value = !0, localStorage.removeItem(Cs), R.value = null);
          } catch {
            I.value = "Authentication required. Your token has expired or is invalid. Please refresh the page.", C.value = !0, localStorage.removeItem(Cs), R.value = null;
          }
          return !1;
        }
        if (!je.ok) {
          try {
            const gs = await je.json();
            I.value = gs.detail || `Error: ${je.statusText}`;
          } catch {
            I.value = `Error: ${je.statusText}. Please try again.`;
          }
          return C.value = !0, !1;
        }
        const Ae = await je.json();
        return Ae.token && (R.value = Ae.token, localStorage.setItem(Cs, Ae.token), window.parent.postMessage({ type: "TOKEN_UPDATE", token: Ae.token }, "*")), ge.value = !0, I.value = null, C.value = !1, tt(R.value || void 0), await K() ? (await Zs(), (d = Ae.agent) != null && d.customization && r(Ae.agent.customization), Ae.agent && !(Ae != null && Ae.human_agent) && (i.value = Ae.agent.name), Ae != null && Ae.human_agent && (B.value = Ae.human_agent), ((g = Ae.agent) == null ? void 0 : g.allow_attachments) !== void 0 && ($.value = Ae.agent.allow_attachments), ((u = Ae.agent) == null ? void 0 : u.workflow) !== void 0 && (window.__INITIAL_DATA__ = window.__INITIAL_DATA__ || {}, window.__INITIAL_DATA__.workflow = Ae.agent.workflow), (ne = Ae.agent) != null && ne.workflow && await it(), !0) : (console.error("Failed to connect to chat service"), I.value = "Failed to connect to chat service. Please try again.", C.value = !0, !1);
      } catch (ke) {
        return console.error("Error checking authorization:", ke), I.value = "An unexpected error occurred. Please try again.", C.value = !0, ge.value = !1, !1;
      } finally {
        y.value = !1;
      }
    }, Zs = async () => {
      !O.value && ge.value && (O.value = !0, await W());
    }, Mn = () => {
      N.value && (N.value.scrollTop = N.value.scrollHeight);
    };
    Qt(() => l.value, (d) => {
      os(() => {
        Mn();
      });
    }, { deep: !0 }), Qt(P, (d, g) => {
      d === "connected" && g !== "connected" && setTimeout(ce, 100);
    }), Qt(() => l.value.length, (d, g) => {
      d > 0 && g === 0 && setTimeout(ce, 100);
    });
    let Gn = null;
    Qt(() => l.value, (d) => {
      const g = d[d.length - 1];
      !qa(g) || g === Gn || (Gn = g, Dn(g));
    }, { deep: !0 });
    const Js = async () => {
      await le() && await Ut();
    }, zt = ue(!1), Fn = ue(0), Yn = ue(""), Mt = ue(0), Ft = ue(!1), ft = ue({}), j = ue(!1), m = ue({}), F = ue(!1), Z = ue(null), Xe = ue("Start Chat"), rt = ue(!1), Ie = ue(null);
    pe(() => {
      var g;
      const d = l.value[l.value.length - 1];
      return ((g = d == null ? void 0 : d.attributes) == null ? void 0 : g.request_rating) || !1;
    });
    const ht = pe(() => {
      var g;
      if (!((g = window.__INITIAL_DATA__) != null && g.workflow))
        return !1;
      const d = l.value.find((u) => u.message_type === "rating");
      return (d == null ? void 0 : d.isSubmitted) === !0;
    }), yt = pe(
      () => Mi(B.value.human_agent_profile_pic)
    ), Dn = async (d) => {
      var g, u, ne, ke, de;
      if (qa(d)) {
        try {
          if (d.session_id && R.value && n.value) {
            const je = new URL(`${js.API_URL}/widgets/${n.value}/end-chat`);
            je.searchParams.append("session_id", d.session_id), (g = d.attributes) != null && g.end_chat_reason && je.searchParams.append("reason", d.attributes.end_chat_reason), (u = d.attributes) != null && u.end_chat_description && je.searchParams.append("description", d.attributes.end_chat_description);
            const Ae = await fetch(je, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${R.value}`,
                "Content-Type": "application/json"
              }
            });
            if (Ae.ok) {
              const Yt = await Ae.json();
              console.info(`✓ Chat session closed on backend: ${Yt.session_id}`);
            } else
              console.warn(`Failed to close session on backend: ${Ae.status}`);
          }
        } catch (je) {
          console.error("Error calling end-chat API:", je);
        }
        if ((ne = d.attributes) != null && ne.end_chat && ((ke = d.attributes) != null && ke.request_rating)) {
          const je = d.agent_name || ((de = B.value) == null ? void 0 : de.human_agent_name) || i.value || "our agent";
          l.value.push({
            message: `Rate the chat session that you had with ${je}`,
            message_type: "rating",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            session_id: d.session_id,
            agent_name: je,
            showFeedback: !1
          }), Ve.value = d.session_id;
        }
      }
    }, hs = (d) => {
      Ft.value || (Mt.value = d);
    }, mt = () => {
      if (!Ft.value) {
        const d = l.value[l.value.length - 1];
        Mt.value = (d == null ? void 0 : d.selectedRating) || 0;
      }
    }, Qs = async (d) => {
      if (!Ft.value) {
        Mt.value = d;
        const g = l.value[l.value.length - 1];
        g && g.message_type === "rating" && (g.showFeedback = !0, g.selectedRating = d);
      }
    }, ei = async (d, g, u = null) => {
      try {
        Ft.value = !0, await oe(g, u);
        const ne = l.value.find((ke) => ke.message_type === "rating");
        ne && (ne.isSubmitted = !0, ne.finalRating = g, ne.finalFeedback = u);
      } catch (ne) {
        console.error("Failed to submit rating:", ne);
      } finally {
        Ft.value = !1;
      }
    }, zc = (d) => {
      const g = {};
      for (const u of d.fields) {
        const ne = ft.value[u.name], ke = Ji(u, ne);
        ke && (g[u.name] = ke);
      }
      return m.value = g, Object.keys(g).length === 0;
    }, Hc = async (d) => {
      if (!(j.value || !zc(d)))
        try {
          j.value = !0, await ee(ft.value);
          const u = l.value.findIndex(
            (ne) => ne.message_type === "form" && (!ne.isSubmitted || ne.isSubmitted === !1)
          );
          u !== -1 && l.value.splice(u, 1), ft.value = {}, m.value = {};
        } catch (u) {
          console.error("Failed to submit form:", u);
        } finally {
          j.value = !1;
        }
    }, Ot = (d, g) => {
      var u, ne;
      if (ft.value[d] = g, g && g.toString().trim() !== "") {
        let ke = null;
        if ((u = Ie.value) != null && u.fields && (ke = Ie.value.fields.find((de) => de.name === d)), !ke && ((ne = Ne.value) != null && ne.fields) && (ke = Ne.value.fields.find((de) => de.name === d)), ke) {
          const de = Ji(ke, g);
          de ? (m.value[d] = de, console.log(`Validation error for ${d}:`, de)) : delete m.value[d];
        }
      } else
        delete m.value[d], console.log(`Cleared error for ${d}`);
    }, qc = (d) => {
      const g = d.replace(/\D/g, "");
      return g.length >= 7 && g.length <= 15;
    }, Ji = (d, g) => {
      if (d.required && (!g || g.toString().trim() === ""))
        return `${d.label} is required`;
      if (!g || g.toString().trim() === "")
        return null;
      if (d.type === "email" && !vs(g))
        return "Please enter a valid email address";
      if (d.type === "tel" && !qc(g))
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
    }, Wc = async () => {
      if (!(j.value || !Ie.value))
        try {
          j.value = !0, m.value = {};
          let d = !1;
          for (const g of Ie.value.fields || []) {
            const u = ft.value[g.name], ne = Ji(g, u);
            ne && (m.value[g.name] = ne, d = !0, console.log(`Validation error for field ${g.name}:`, ne));
          }
          if (d) {
            j.value = !1, console.log("Validation failed, not submitting");
            return;
          }
          await ee(ft.value), rt.value = !1, Ie.value = null, ft.value = {};
        } catch (d) {
          console.error("Failed to submit full screen form:", d);
        } finally {
          j.value = !1, console.log("Full screen form submission completed");
        }
    }, jc = (d, g) => {
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
    }, Vc = (d) => {
      if (!d) return "";
      let g = d.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "");
      const u = [];
      return g = g.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (ne, ke, de) => {
        const je = `__MARKDOWN_LINK_${u.length}__`;
        return console.log("Found markdown link:", ne, "-> placeholder:", je), u.push(ne), je;
      }), console.log("After replacing markdown links with placeholders:", g), console.log("Markdown links array:", u), g = g.replace(/https?:\/\/[^\s\)]+/g, "[link removed]"), console.log("After removing standalone URLs:", g), u.forEach((ne, ke) => {
        g = g.replace(`__MARKDOWN_LINK_${ke}__`, ne), console.log(`Restored markdown link ${ke}:`, ne);
      }), g = g.replace(/\n\s*\n\s*\n/g, `

`).trim(), g;
    }, Co = ue(!1);
    ue(!1);
    const Ro = pe(() => {
      var d;
      return !!((d = B.value) != null && d.human_agent_name);
    }), Kc = pe(() => $.value && Ro.value && nt.value.length < tl), Gc = async () => {
      try {
        F.value = !1, Z.value = null, await et();
      } catch (d) {
        console.error("Failed to proceed workflow:", d);
      }
    }, Qi = async (d) => {
      try {
        if (!d.userInputValue || !d.userInputValue.trim())
          return;
        const g = d.userInputValue.trim();
        d.isSubmitted = !0, d.submittedValue = g, await V(g, Re.value);
      } catch (g) {
        console.error("Failed to submit user input:", g), d.isSubmitted = !1, d.submittedValue = null;
      }
    }, Io = async () => {
      var d, g, u;
      try {
        let ne = 0;
        const ke = 50;
        for (; !((d = window.__INITIAL_DATA__) != null && d.widgetId) && ne < ke; )
          await new Promise((je) => setTimeout(je, 100)), ne++;
        return (g = window.__INITIAL_DATA__) != null && g.widgetId ? (lt(window.__INITIAL_DATA__.widgetId), await Ut() ? ((u = window.__INITIAL_DATA__) != null && u.workflow && ge.value && await it(), !0) : (P.value = "connected", !1)) : (console.error("Widget data not available after waiting"), !1);
      } catch (ne) {
        return console.error("Failed to initialize widget:", ne), !1;
      }
    };
    window.addEventListener("message", (d) => {
      d.source === window.parent && (!d.data || typeof d.data.type != "string" || (d.data.type === "SCROLL_TO_BOTTOM" && Mn(), d.data.type === "TOKEN_RECEIVED" && localStorage.setItem(Cs, d.data.token), d.data.type === "WIDGET_VISIBILITY" && (Bo.value = !!d.data.open), d.data.type === "WIDGET_DISPLAY" && (ir.value = {
        mode: d.data.mode,
        width: d.data.width,
        height: d.data.height,
        hotkey: d.data.hotkey
      }), d.data.type === "PREFILL_MESSAGE" && typeof d.data.text == "string" && (te.value = d.data.text.slice(0, 2e3), os(() => {
        const g = document.querySelector(
          ".message-input input, .welcome-message-field"
        );
        g == null || g.focus();
      }))));
    });
    const Yc = () => {
      q(async () => {
        await Ut();
      }), Ce((d) => {
        var g;
        if (Xe.value = d.button_text || "Start Chat", d.type === "landing_page")
          Z.value = d.landing_page_data, F.value = !0, rt.value = !1;
        else if (d.type === "form" || d.type === "display_form")
          if (((g = d.form_data) == null ? void 0 : g.form_full_screen) === !0)
            Ie.value = d.form_data, rt.value = !0, F.value = !1;
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
              (ke) => ke.message_type === "form" && !ke.isSubmitted
            ) === -1 && l.value.push(u), F.value = !1, rt.value = !1;
          }
        else
          F.value = !1, rt.value = !1;
      }), we((d) => {
        console.log("Workflow proceeded:", d);
      });
    }, Xc = async () => {
      try {
        await Io(), await it();
      } catch (d) {
        throw console.error("Failed to start new conversation:", d), d;
      }
    }, Zc = async () => {
      ht.value = !1, l.value = [], B.value = {}, await Xc();
    };
    Wi(async () => {
      await Io(), Yc(), H(), document.addEventListener("click", p), (() => {
        const g = l.value.length > 0, u = P.value === "connected", ne = document.querySelector('input[type="text"], textarea') !== null;
        return g || u || ne;
      })() && setTimeout(ce, 100);
    }), Ks(() => {
      window.removeEventListener("message", (d) => {
        d.data.type === "SCROLL_TO_BOTTOM" && Mn();
      }), document.removeEventListener("click", p), Oe && (Oe.disconnect(), Oe = null), H.timeoutId && (clearTimeout(H.timeoutId), H.timeoutId = null), Me(), be();
    });
    const Xn = pe(() => s.value.chat_style === "AURORA"), Ht = pe(() => s.value.chat_style === "ASK_ANYTHING" || Xn.value), Lo = pe(() => s.value.customization_metadata), ti = pe(() => {
      var g;
      const d = (g = Lo.value) == null ? void 0 : g.avatar_style;
      return d === "orb" ? !0 : d === "photo" ? !1 : Xn.value && !s.value.photo_url;
    }), ds = pe(() => {
      var d;
      return op(i.value || "", (d = Lo.value) == null ? void 0 : d.orb_variant);
    }), Jc = {
      GLASS: "theme-glass",
      TERMINAL: "theme-terminal",
      PLAYFUL: "theme-playful",
      CALM_MINT: "theme-calm",
      SUNRISE: "theme-sunrise"
    }, Qc = pe(() => Jc[s.value.chat_style] || ""), eu = pe(() => Sg(s.value.chat_style, {
      chat_background_color: s.value.chat_background_color,
      chat_text_color: s.value.chat_text_color,
      accent_color: s.value.accent_color,
      font_family: s.value.font_family
    })), er = pe(
      () => Array.isArray(s.value.quick_actions) ? s.value.quick_actions.filter((d) => !!d && d.trim().length > 0) : []
    ), Oo = pe(() => (s.value.welcome_message || "").trim()), Po = pe(
      () => !Ht.value && l.value.length === 0 && !_.value && !Zn.value
    ), tu = pe(
      () => Po.value && Oo.value.length > 0
    ), nu = pe(
      () => Po.value && !ht.value && er.value.length > 0
    ), ni = pe(() => s.value.show_citations === !0), No = pe(() => ap(s.value.show_ai_disclaimer, Ro.value)), su = (d) => /^[0-9a-f]{16,}$/i.test(d) || /^[0-9a-f-]{32,}$/i.test(d), tr = (d) => {
      const g = (d || "").trim().toLowerCase();
      return !g || g === "unknown" ? "Knowledge base" : g.charAt(0).toUpperCase() + g.slice(1);
    }, nr = (d) => {
      let g = ((d == null ? void 0 : d.name) || "").trim();
      return !g || (g = g.replace(/^[0-9a-f]{16,}[_-]/i, "").replace(/\.(pdf|txt|md|html?|docx?|csv|json)$/i, ""), !g || su(g)) ? tr(d == null ? void 0 : d.type) : g;
    }, Mo = (d) => {
      const g = nr(d), u = tr(d == null ? void 0 : d.type);
      return g === u ? u : `${g} · ${u}`;
    }, sr = pe(() => s.value.collect_email === !0 && !Ht.value), Fo = ue(!1), xn = ue(""), ps = ue(!1), Zn = pe(() => !O.value && sr.value && !Fo.value), Do = async () => {
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
        await Ut(), Fo.value = !0;
      } catch {
        xn.value = "Something went wrong. Please try again.";
      } finally {
        ps.value = !1;
      }
    }, ir = ue(null), Bo = ue(!0), rr = { mode: "floating", width: 400, height: 560 }, $o = pe(
      () => {
        var d;
        return ir.value || ((d = s.value.customization_metadata) == null ? void 0 : d.widget_display) || null;
      }
    ), iu = pe(() => {
      const d = $o.value;
      return d ? typeof d.mode == "string" && d.mode !== rr.mode || typeof d.width == "number" && d.width !== rr.width || typeof d.height == "number" && d.height !== rr.height : !1;
    }), ru = pe(() => {
      var g;
      const d = {
        width: "100%",
        height: "100%",
        borderRadius: "var(--radius-lg)"
      };
      if (iu.value) {
        const u = (g = $o.value) == null ? void 0 : g.mode;
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
    }), Uo = pe(() => Ht.value && l.value.length === 0), ou = ["form", "user_input", "rating", "product", "shopify_output"], au = pe(
      () => l.value.some(
        (d) => ou.includes(d.message_type) || Array.isArray(d.attachments) && d.attachments.length > 0
      )
    ), zo = pe(
      () => Ht.value && ot.value && !F.value && !rt.value && !Zn.value && !ht.value && !au.value
    ), lu = pe(
      () => s.value.welcome_subtitle || `Ask a question — ${i.value || "the assistant"} answers from what it knows.`
    ), cu = pe(() => {
      var d;
      return ((d = ir.value) == null ? void 0 : d.hotkey) !== !1;
    });
    return (d, g) => C.value && U.value ? (k(), A("div", Cg, [
      b("button", {
        type: "button",
        class: "cm-error-close",
        "aria-label": "Close chat",
        title: "Close",
        onClick: Kn
      }, "×"),
      g[20] || (g[20] = Un('<div class="widget-unavailable-card" data-v-260c031d><div class="widget-unavailable-icon-wrapper" data-v-260c031d><svg class="widget-unavailable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-260c031d><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" data-v-260c031d></path><path d="M9 12l2 2 4-4" data-v-260c031d></path></svg></div><h2 class="widget-unavailable-title" data-v-260c031d>Chat Unavailable</h2><p class="widget-unavailable-message" data-v-260c031d> This chat widget is not currently configured. Please contact the website administrator to enable chat support. </p><div class="widget-unavailable-footer" data-v-260c031d><svg class="chattermate-logo-small" width="14" height="14" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-260c031d><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-260c031d></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-260c031d><span class="cm-powered-prefix" data-v-260c031d>Powered by </span><strong class="cm-brand" data-v-260c031d>ChatterMate</strong></a></div></div>', 1))
    ])) : C.value ? (k(), A("div", Rg, [
      b("button", {
        type: "button",
        class: "cm-error-close",
        "aria-label": "Close chat",
        title: "Close",
        onClick: Kn
      }, "×"),
      b("div", Ig, [
        g[21] || (g[21] = Un('<div class="auth-error-header" data-v-260c031d><svg class="auth-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-260c031d><circle cx="12" cy="12" r="10" data-v-260c031d></circle><line x1="12" y1="8" x2="12" y2="12" data-v-260c031d></line><line x1="12" y1="16" x2="12.01" y2="16" data-v-260c031d></line></svg><h2 data-v-260c031d>Authentication Error</h2></div>', 1)),
        b("p", Lg, se(I.value), 1),
        b("button", {
          class: "auth-error-refresh-btn",
          onClick: g[0] || (g[0] = () => d.window.location.reload())
        }, " Refresh Page ")
      ])
    ])) : n.value && !C.value ? (k(), A("div", {
      key: 2,
      class: Je(["chat-container cm-surface", [{ collapsed: !ot.value, "ask-anything-style": Ht.value, aurora: Xn.value }, Qc.value]]),
      style: Te({ ...S(ut), ...ru.value, ...eu.value })
    }, [
      y.value ? (k(), A("div", Og, g[22] || (g[22] = [
        Un('<div class="loading-spinner" data-v-260c031d><div class="dot" data-v-260c031d></div><div class="dot" data-v-260c031d></div><div class="dot" data-v-260c031d></div></div><div class="loading-text" data-v-260c031d>Initializing chat...</div>', 2)
      ]))) : ae("", !0),
      !y.value && S(P) !== "connected" ? (k(), A("div", {
        key: 1,
        class: Je(["connection-status", S(P)])
      }, [
        S(P) === "connecting" ? (k(), A("div", Pg, g[23] || (g[23] = [
          dn(" Connecting to chat service... ", -1),
          b("div", { class: "loading-dots" }, [
            b("div", { class: "dot" }),
            b("div", { class: "dot" }),
            b("div", { class: "dot" })
          ], -1)
        ]))) : S(P) === "failed" ? (k(), A("div", Ng, [
          g[24] || (g[24] = dn(" Connection failed. ", -1)),
          b("button", {
            onClick: Js,
            class: "reconnect-button"
          }, " Click here to reconnect ")
        ])) : ae("", !0)
      ], 2)) : ae("", !0),
      S(w) ? (k(), A("div", {
        key: 2,
        class: "error-alert",
        style: Te(S(z))
      }, se(S(c)), 5)) : ae("", !0),
      zo.value ? (k(), ec(sp, {
        key: 3,
        messages: S(l),
        draft: te.value,
        "agent-name": S(i),
        suggestions: er.value,
        "welcome-title": S(s).welcome_title,
        "welcome-subtitle": lu.value,
        placeholder: Nn.value,
        "input-enabled": $t.value,
        loading: S(h),
        "show-citations": ni.value,
        disclaimer: No.value ? S(Wa) : "",
        active: Bo.value,
        hotkey: cu.value,
        "citation-label": nr,
        "citation-tooltip": Mo,
        "onUpdate:draft": g[1] || (g[1] = (u) => te.value = u),
        onSend: tn,
        onAsk: fs,
        onClose: Kn
      }, null, 8, ["messages", "draft", "agent-name", "suggestions", "welcome-title", "welcome-subtitle", "placeholder", "input-enabled", "loading", "show-citations", "disclaimer", "active", "hotkey"])) : Uo.value ? (k(), A("div", {
        key: 4,
        class: Je(["welcome-message-section", { aurora: Xn.value }]),
        style: Te(S(J))
      }, [
        b("div", Mg, [
          b("div", Fg, [
            ti.value ? (k(), A("div", {
              key: 0,
              class: "welcome-orb",
              style: Te(ds.value)
            }, null, 4)) : S(he) ? (k(), A("img", {
              key: 1,
              src: S(he),
              alt: S(i),
              class: "welcome-avatar"
            }, null, 8, Dg)) : ae("", !0),
            b("h1", Bg, se(S(s).welcome_title || `Welcome to ${S(i)}`), 1),
            b("p", $g, se(S(s).welcome_subtitle || "I'm here to help you with anything you need. What can I assist you with today?"), 1)
          ])
        ]),
        b("div", Ug, [
          !S(O) && !ge.value && sr.value ? (k(), A("div", zg, [
            An(b("input", {
              "onUpdate:modelValue": g[2] || (g[2] = (u) => Re.value = u),
              type: "email",
              placeholder: "Enter your email address",
              disabled: S(h) || S(P) !== "connected",
              class: Je([{
                invalid: Re.value.trim() && !S(vs)(Re.value.trim()),
                disabled: S(P) !== "connected"
              }, "welcome-email-input"])
            }, null, 10, Hg), [
              [zn, Re.value]
            ])
          ])) : ae("", !0),
          b("div", qg, [
            An(b("input", {
              "onUpdate:modelValue": g[3] || (g[3] = (u) => te.value = u),
              type: "text",
              placeholder: Nn.value,
              onKeypress: Nt,
              onInput: Ke,
              onChange: Ke,
              disabled: !$t.value,
              class: Je([{ disabled: !$t.value }, "welcome-message-field"])
            }, null, 42, Wg), [
              [zn, te.value]
            ]),
            b("button", {
              class: Je(["welcome-send-button", { "aurora-send": Xn.value }]),
              style: Te(S(Q)),
              onClick: tn,
              disabled: !te.value.trim() || !$t.value
            }, [
              Xn.value ? (k(), A("svg", Vg, g[25] || (g[25] = [
                b("path", {
                  d: "M12 19V5M12 5L5 12M12 5L19 12",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, null, -1)
              ]))) : (k(), A("svg", Kg, g[26] || (g[26] = [
                b("path", {
                  d: "M5 12L3 21L21 12L3 3L5 12ZM5 12L13 12",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, null, -1)
              ])))
            ], 14, jg)
          ])
        ]),
        b("div", {
          class: "powered-by-welcome",
          style: Te(S(re))
        }, g[27] || (g[27] = [
          Un('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-260c031d><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-260c031d></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-260c031d><span class="cm-powered-prefix" data-v-260c031d>Powered by </span><strong class="cm-brand" data-v-260c031d>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 6)) : ae("", !0),
      F.value && Z.value ? (k(), A("div", {
        key: 5,
        class: "landing-page-fullscreen",
        style: Te(S(J))
      }, [
        b("div", Gg, [
          b("div", Yg, [
            b("h2", Xg, se(Z.value.heading), 1),
            b("div", Zg, se(Z.value.content), 1)
          ]),
          b("div", Jg, [
            b("button", {
              class: "landing-page-button",
              onClick: Gc
            }, se(Xe.value), 1)
          ])
        ]),
        b("div", {
          class: "powered-by-landing",
          style: Te(S(re))
        }, g[28] || (g[28] = [
          Un('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-260c031d><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-260c031d></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-260c031d><span class="cm-powered-prefix" data-v-260c031d>Powered by </span><strong class="cm-brand" data-v-260c031d>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 4)) : rt.value && Ie.value ? (k(), A("div", {
        key: 6,
        class: "form-fullscreen",
        style: Te(S(J))
      }, [
        b("div", Qg, [
          Ie.value.title || Ie.value.description ? (k(), A("div", em, [
            Ie.value.title ? (k(), A("h2", tm, se(Ie.value.title), 1)) : ae("", !0),
            Ie.value.description ? (k(), A("p", nm, se(Ie.value.description), 1)) : ae("", !0)
          ])) : ae("", !0),
          b("div", sm, [
            (k(!0), A(De, null, vt(Ie.value.fields, (u) => {
              var ne, ke;
              return k(), A("div", {
                key: u.name,
                class: "form-field"
              }, [
                b("label", {
                  for: `fullscreen-form-${u.name}`,
                  class: "field-label"
                }, [
                  dn(se(u.label) + " ", 1),
                  u.required ? (k(), A("span", rm, "*")) : ae("", !0)
                ], 8, im),
                u.type === "text" || u.type === "email" || u.type === "tel" ? (k(), A("input", {
                  key: 0,
                  id: `fullscreen-form-${u.name}`,
                  type: u.type,
                  placeholder: u.placeholder || "",
                  required: u.required,
                  minlength: u.minLength,
                  maxlength: u.maxLength,
                  value: ft.value[u.name] || "",
                  onInput: (de) => Ot(u.name, de.target.value),
                  onBlur: (de) => Ot(u.name, de.target.value),
                  class: Je(["form-input", { error: m.value[u.name] }]),
                  autocomplete: u.type === "email" ? "email" : u.type === "tel" ? "tel" : "off",
                  inputmode: u.type === "tel" ? "tel" : u.type === "email" ? "email" : "text"
                }, null, 42, om)) : u.type === "number" ? (k(), A("input", {
                  key: 1,
                  id: `fullscreen-form-${u.name}`,
                  type: "number",
                  placeholder: u.placeholder || "",
                  required: u.required,
                  min: u.minLength,
                  max: u.maxLength,
                  value: ft.value[u.name] || "",
                  onInput: (de) => Ot(u.name, de.target.value),
                  class: Je(["form-input", { error: m.value[u.name] }])
                }, null, 42, am)) : u.type === "textarea" ? (k(), A("textarea", {
                  key: 2,
                  id: `fullscreen-form-${u.name}`,
                  placeholder: u.placeholder || "",
                  required: u.required,
                  minlength: u.minLength,
                  maxlength: u.maxLength,
                  value: ft.value[u.name] || "",
                  onInput: (de) => Ot(u.name, de.target.value),
                  class: Je(["form-textarea", { error: m.value[u.name] }]),
                  rows: "4"
                }, null, 42, lm)) : u.type === "select" ? (k(), A("select", {
                  key: 3,
                  id: `fullscreen-form-${u.name}`,
                  required: u.required,
                  value: ft.value[u.name] || "",
                  onChange: (de) => Ot(u.name, de.target.value),
                  class: Je(["form-select", { error: m.value[u.name] }])
                }, [
                  b("option", um, se(u.placeholder || "Please select..."), 1),
                  (k(!0), A(De, null, vt((Array.isArray(u.options) ? u.options : ((ne = u.options) == null ? void 0 : ne.split(`
`)) || []).filter((de) => de.trim()), (de) => (k(), A("option", {
                    key: de,
                    value: de.trim()
                  }, se(de.trim()), 9, fm))), 128))
                ], 42, cm)) : u.type === "checkbox" ? (k(), A("label", hm, [
                  b("input", {
                    id: `fullscreen-form-${u.name}`,
                    type: "checkbox",
                    required: u.required,
                    checked: ft.value[u.name] || !1,
                    onChange: (de) => Ot(u.name, de.target.checked),
                    class: "form-checkbox"
                  }, null, 40, dm),
                  b("span", pm, se(u.label), 1)
                ])) : u.type === "radio" ? (k(), A("div", gm, [
                  (k(!0), A(De, null, vt((Array.isArray(u.options) ? u.options : ((ke = u.options) == null ? void 0 : ke.split(`
`)) || []).filter((de) => de.trim()), (de) => (k(), A("label", {
                    key: de,
                    class: "radio-field"
                  }, [
                    b("input", {
                      type: "radio",
                      name: `fullscreen-form-${u.name}`,
                      value: de.trim(),
                      required: u.required,
                      checked: ft.value[u.name] === de.trim(),
                      onChange: (je) => Ot(u.name, de.trim()),
                      class: "form-radio"
                    }, null, 40, mm),
                    b("span", _m, se(de.trim()), 1)
                  ]))), 128))
                ])) : ae("", !0),
                m.value[u.name] ? (k(), A("div", ym, se(m.value[u.name]), 1)) : ae("", !0)
              ]);
            }), 128))
          ]),
          b("div", vm, [
            b("button", {
              onClick: g[4] || (g[4] = () => {
                console.log("Submit button clicked!"), Wc();
              }),
              disabled: j.value,
              class: "submit-form-button",
              style: Te(S(Q))
            }, [
              j.value ? (k(), A("span", wm, g[29] || (g[29] = [
                b("div", { class: "dot" }, null, -1),
                b("div", { class: "dot" }, null, -1),
                b("div", { class: "dot" }, null, -1)
              ]))) : (k(), A("span", km, se(Ie.value.submit_button_text || "Submit"), 1))
            ], 12, bm)
          ])
        ]),
        b("div", {
          class: "powered-by-landing",
          style: Te(S(re))
        }, g[30] || (g[30] = [
          Un('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-260c031d><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-260c031d></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-260c031d><span class="cm-powered-prefix" data-v-260c031d>Powered by </span><strong class="cm-brand" data-v-260c031d>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 4)) : !Uo.value && ot.value && !zo.value ? (k(), A("div", {
        key: 7,
        class: Je(["chat-panel", { "ask-anything-chat": Ht.value }]),
        style: Te(S(J))
      }, [
        Ht.value ? (k(), A("div", {
          key: 1,
          class: "ask-anything-top",
          style: Te(S(Pe))
        }, [
          b("div", Sm, [
            yt.value || S(he) ? (k(), A("img", {
              key: 0,
              src: yt.value || S(he),
              alt: S(B).human_agent_name || S(i),
              class: "header-avatar"
            }, null, 8, Em)) : ae("", !0),
            b("div", Cm, [
              b("h3", {
                style: Te(S(re))
              }, se(S(i)), 5),
              b("p", {
                class: "ask-anything-subtitle",
                style: Te(S(re))
              }, se(S(s).welcome_subtitle || "Ask me anything. I'm here to help."), 5)
            ])
          ])
        ], 4)) : (k(), A("div", {
          key: 0,
          class: "chat-header",
          style: Te(S(Pe))
        }, [
          b("div", {
            class: "cm-header-sheen",
            style: Te({ background: "linear-gradient(90deg, transparent, " + (S(s).accent_color || "#C9F24E") + ", transparent)" })
          }, null, 4),
          b("div", xm, [
            !yt.value && (ti.value || !S(he)) ? (k(), A("div", {
              key: 0,
              class: "header-orb",
              style: Te(ds.value)
            }, null, 4)) : yt.value || S(he) ? (k(), A("img", {
              key: 1,
              src: yt.value || S(he),
              alt: S(B).human_agent_name || S(i),
              class: "header-avatar"
            }, null, 8, Am)) : ae("", !0),
            b("div", Tm, [
              b("h3", {
                style: Te(S(re))
              }, se(S(B).human_agent_name || S(i)), 5),
              g[31] || (g[31] = b("div", { class: "status" }, [
                b("span", { class: "status-indicator online" }),
                b("span", { class: "status-text cm-presence" }, "Online · replies instantly")
              ], -1))
            ])
          ]),
          b("button", {
            type: "button",
            class: "header-minimize",
            style: Te(S(re)),
            title: "Minimize",
            "aria-label": "Minimize chat",
            onClick: Kn
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
        ], 4)),
        S(_) ? (k(), A("div", Rm, g[33] || (g[33] = [
          b("div", { class: "loading-spinner" }, [
            b("div", { class: "dot" }),
            b("div", { class: "dot" }),
            b("div", { class: "dot" })
          ], -1)
        ]))) : ae("", !0),
        Zn.value ? (k(), A("div", {
          key: 3,
          class: "cm-email-gate",
          style: Te(S(J))
        }, [
          b("div", {
            class: "cm-email-gate-orb",
            style: Te(ds.value)
          }, null, 4),
          b("h3", Im, se(S(s).welcome_title || "Before we start"), 1),
          g[34] || (g[34] = b("p", { class: "cm-email-gate-text" }, "Enter your email and we'll continue the chat.", -1)),
          An(b("input", {
            "onUpdate:modelValue": g[5] || (g[5] = (u) => Re.value = u),
            type: "email",
            inputmode: "email",
            autocomplete: "email",
            placeholder: "you@example.com",
            class: Je(["cm-email-gate-input", { invalid: !!xn.value }]),
            disabled: ps.value,
            onKeyup: mi(Do, ["enter"]),
            onInput: g[6] || (g[6] = (u) => xn.value = "")
          }, null, 42, Lm), [
            [zn, Re.value]
          ]),
          xn.value ? (k(), A("p", Om, se(xn.value), 1)) : ae("", !0),
          b("button", {
            type: "button",
            class: "cm-email-gate-btn",
            style: Te(S(Q)),
            disabled: ps.value,
            onClick: Do
          }, se(ps.value ? "Please wait…" : "Continue to chat"), 13, Pm)
        ], 4)) : ae("", !0),
        An(b("div", {
          class: "chat-messages",
          ref_key: "messagesContainer",
          ref: N
        }, [
          tu.value ? (k(), A("div", Nm, [
            b("div", Mm, [
              ti.value || !S(he) ? (k(), A("div", {
                key: 0,
                class: "cm-welcome-orb",
                style: Te(ds.value)
              }, null, 4)) : (k(), A("img", {
                key: 1,
                src: S(he),
                alt: S(i),
                class: "cm-welcome-avatar"
              }, null, 8, Fm)),
              b("div", {
                class: "message-bubble cm-welcome-bubble",
                style: Te(S(Y))
              }, se(Oo.value), 5)
            ])
          ])) : ae("", !0),
          (k(!0), A(De, null, vt(S(l), (u, ne) => {
            var ke, de, je, Ae, Yt, gs, Jn, qo, Wo, jo, Vo, Ko, Go, Yo, Xo, Zo, Jo, Qo, ea;
            return k(), A("div", {
              key: ne,
              class: Je([
                "message",
                u.message_type === "bot" || u.message_type === "agent" ? "agent-message" : u.message_type === "system" ? "system-message" : u.message_type === "rating" ? "rating-message" : u.message_type === "form" ? "form-message" : u.message_type === "product" || u.shopify_output ? "product-message" : "user-message"
              ])
            }, [
              u.message_type === "bot" || u.message_type === "agent" ? (k(), A("div", Dm, [
                yt.value ? (k(), A("img", {
                  key: 0,
                  src: yt.value,
                  class: "cm-msg-avatar-img",
                  alt: ""
                }, null, 8, Bm)) : !ti.value && S(he) ? (k(), A("img", {
                  key: 1,
                  src: S(he),
                  class: "cm-msg-avatar-img",
                  alt: ""
                }, null, 8, $m)) : (k(), A("div", {
                  key: 2,
                  class: "cm-msg-avatar-orb",
                  style: Te(ds.value)
                }, null, 4))
              ])) : ae("", !0),
              b("div", Um, [
                b("div", {
                  class: "message-bubble",
                  style: Te(u.message_type === "system" || u.message_type === "rating" || u.message_type === "form" || u.message_type === "product" || u.shopify_output ? {} : u.message_type === "user" ? S(Q) : S(Y))
                }, [
                  u.message_type === "rating" ? (k(), A("div", zm, [
                    b("p", Hm, "Rate the chat session that you had with " + se(u.agent_name || S(B).human_agent_name || S(i) || "our agent"), 1),
                    b("div", {
                      class: Je(["star-rating", { submitted: Ft.value || u.isSubmitted }])
                    }, [
                      (k(), A(De, null, vt(5, (L) => b("button", {
                        key: L,
                        class: Je(["star-button", {
                          warning: L <= (u.isSubmitted ? u.finalRating : Mt.value || u.selectedRating) && (u.isSubmitted ? u.finalRating : Mt.value || u.selectedRating) <= 3,
                          success: L <= (u.isSubmitted ? u.finalRating : Mt.value || u.selectedRating) && (u.isSubmitted ? u.finalRating : Mt.value || u.selectedRating) > 3,
                          selected: L <= (u.isSubmitted ? u.finalRating : Mt.value || u.selectedRating)
                        }]),
                        onMouseover: (Xt) => !u.isSubmitted && hs(L),
                        onMouseleave: (Xt) => !u.isSubmitted && mt,
                        onClick: (Xt) => !u.isSubmitted && Qs(L),
                        disabled: Ft.value || u.isSubmitted
                      }, " ★ ", 42, qm)), 64))
                    ], 2),
                    u.showFeedback && !u.isSubmitted ? (k(), A("div", Wm, [
                      b("div", jm, [
                        An(b("input", {
                          "onUpdate:modelValue": (L) => u.feedback = L,
                          placeholder: "Please share your feedback (optional)",
                          disabled: Ft.value,
                          maxlength: "500",
                          class: "feedback-input"
                        }, null, 8, Vm), [
                          [zn, u.feedback]
                        ]),
                        b("div", Km, se(((ke = u.feedback) == null ? void 0 : ke.length) || 0) + "/500", 1)
                      ]),
                      b("button", {
                        onClick: (L) => ei(u.session_id, Mt.value, u.feedback),
                        disabled: Ft.value || !Mt.value,
                        class: "submit-rating-button",
                        style: Te({ backgroundColor: S(s).accent_color || "var(--accent-solid)" })
                      }, se(Ft.value ? "Submitting..." : "Submit Rating"), 13, Gm)
                    ])) : ae("", !0),
                    u.isSubmitted && u.finalFeedback ? (k(), A("div", Ym, [
                      b("div", Xm, [
                        b("p", Zm, se(u.finalFeedback), 1)
                      ])
                    ])) : u.isSubmitted ? (k(), A("div", Jm, " Thank you for your rating! ")) : ae("", !0)
                  ])) : u.message_type === "form" ? (k(), A("div", Qm, [
                    (je = (de = u.attributes) == null ? void 0 : de.form_data) != null && je.title || (Yt = (Ae = u.attributes) == null ? void 0 : Ae.form_data) != null && Yt.description ? (k(), A("div", e_, [
                      (Jn = (gs = u.attributes) == null ? void 0 : gs.form_data) != null && Jn.title ? (k(), A("h3", t_, se(u.attributes.form_data.title), 1)) : ae("", !0),
                      (Wo = (qo = u.attributes) == null ? void 0 : qo.form_data) != null && Wo.description ? (k(), A("p", n_, se(u.attributes.form_data.description), 1)) : ae("", !0)
                    ])) : ae("", !0),
                    b("div", s_, [
                      (k(!0), A(De, null, vt((Vo = (jo = u.attributes) == null ? void 0 : jo.form_data) == null ? void 0 : Vo.fields, (L) => {
                        var Xt, or;
                        return k(), A("div", {
                          key: L.name,
                          class: "form-field"
                        }, [
                          b("label", {
                            for: `form-${L.name}`,
                            class: "field-label"
                          }, [
                            dn(se(L.label) + " ", 1),
                            L.required ? (k(), A("span", r_, "*")) : ae("", !0)
                          ], 8, i_),
                          L.type === "text" || L.type === "email" || L.type === "tel" ? (k(), A("input", {
                            key: 0,
                            id: `form-${L.name}`,
                            type: L.type,
                            placeholder: L.placeholder || "",
                            required: L.required,
                            minlength: L.minLength,
                            maxlength: L.maxLength,
                            value: ft.value[L.name] || "",
                            onInput: (ze) => Ot(L.name, ze.target.value),
                            onBlur: (ze) => Ot(L.name, ze.target.value),
                            class: Je(["form-input", { error: m.value[L.name] }]),
                            disabled: j.value,
                            autocomplete: L.type === "email" ? "email" : L.type === "tel" ? "tel" : "off",
                            inputmode: L.type === "tel" ? "tel" : L.type === "email" ? "email" : "text"
                          }, null, 42, o_)) : L.type === "number" ? (k(), A("input", {
                            key: 1,
                            id: `form-${L.name}`,
                            type: "number",
                            placeholder: L.placeholder || "",
                            required: L.required,
                            min: L.min,
                            max: L.max,
                            value: ft.value[L.name] || "",
                            onInput: (ze) => Ot(L.name, ze.target.value),
                            class: Je(["form-input", { error: m.value[L.name] }]),
                            disabled: j.value
                          }, null, 42, a_)) : L.type === "textarea" ? (k(), A("textarea", {
                            key: 2,
                            id: `form-${L.name}`,
                            placeholder: L.placeholder || "",
                            required: L.required,
                            minlength: L.minLength,
                            maxlength: L.maxLength,
                            value: ft.value[L.name] || "",
                            onInput: (ze) => Ot(L.name, ze.target.value),
                            class: Je(["form-textarea", { error: m.value[L.name] }]),
                            disabled: j.value,
                            rows: "3"
                          }, null, 42, l_)) : L.type === "select" ? (k(), A("select", {
                            key: 3,
                            id: `form-${L.name}`,
                            required: L.required,
                            value: ft.value[L.name] || "",
                            onChange: (ze) => Ot(L.name, ze.target.value),
                            class: Je(["form-select", { error: m.value[L.name] }]),
                            disabled: j.value
                          }, [
                            b("option", u_, se(L.placeholder || "Select an option"), 1),
                            (k(!0), A(De, null, vt((Array.isArray(L.options) ? L.options : ((Xt = L.options) == null ? void 0 : Xt.split(`
`)) || []).filter((ze) => ze.trim()), (ze) => (k(), A("option", {
                              key: ze.trim(),
                              value: ze.trim()
                            }, se(ze.trim()), 9, f_))), 128))
                          ], 42, c_)) : L.type === "checkbox" ? (k(), A("div", h_, [
                            b("input", {
                              id: `form-${L.name}`,
                              type: "checkbox",
                              checked: ft.value[L.name] || !1,
                              onChange: (ze) => Ot(L.name, ze.target.checked),
                              class: "form-checkbox",
                              disabled: j.value
                            }, null, 40, d_),
                            b("label", {
                              for: `form-${L.name}`,
                              class: "checkbox-label"
                            }, se(L.placeholder || L.label), 9, p_)
                          ])) : L.type === "radio" ? (k(), A("div", g_, [
                            (k(!0), A(De, null, vt((Array.isArray(L.options) ? L.options : ((or = L.options) == null ? void 0 : or.split(`
`)) || []).filter((ze) => ze.trim()), (ze) => (k(), A("div", {
                              key: ze.trim(),
                              class: "radio-option"
                            }, [
                              b("input", {
                                id: `form-${L.name}-${ze.trim()}`,
                                name: `form-${L.name}`,
                                type: "radio",
                                value: ze.trim(),
                                checked: ft.value[L.name] === ze.trim(),
                                onChange: (Fy) => Ot(L.name, ze.trim()),
                                class: "form-radio",
                                disabled: j.value
                              }, null, 40, m_),
                              b("label", {
                                for: `form-${L.name}-${ze.trim()}`,
                                class: "radio-label"
                              }, se(ze.trim()), 9, __)
                            ]))), 128))
                          ])) : ae("", !0),
                          m.value[L.name] ? (k(), A("div", y_, se(m.value[L.name]), 1)) : ae("", !0)
                        ]);
                      }), 128))
                    ]),
                    b("div", v_, [
                      b("button", {
                        onClick: () => {
                          var L;
                          console.log("Regular form submit button clicked!"), Hc((L = u.attributes) == null ? void 0 : L.form_data);
                        },
                        disabled: j.value,
                        class: "form-submit-button",
                        style: Te(S(Q))
                      }, se(j.value ? "Submitting..." : ((Go = (Ko = u.attributes) == null ? void 0 : Ko.form_data) == null ? void 0 : Go.submit_button_text) || "Submit"), 13, b_)
                    ])
                  ])) : u.message_type === "user_input" ? (k(), A("div", w_, [
                    (Yo = u.attributes) != null && Yo.prompt_message && u.attributes.prompt_message.trim() ? (k(), A("div", k_, se(u.attributes.prompt_message), 1)) : ae("", !0),
                    u.isSubmitted ? (k(), A("div", S_, [
                      g[35] || (g[35] = b("strong", null, "Your input:", -1)),
                      dn(" " + se(u.submittedValue) + " ", 1),
                      (Xo = u.attributes) != null && Xo.confirmation_message && u.attributes.confirmation_message.trim() ? (k(), A("div", E_, se(u.attributes.confirmation_message), 1)) : ae("", !0)
                    ])) : (k(), A("div", x_, [
                      An(b("textarea", {
                        "onUpdate:modelValue": (L) => u.userInputValue = L,
                        class: "user-input-textarea",
                        placeholder: "Type your message here...",
                        rows: "3",
                        onKeydown: [
                          mi(qn((L) => Qi(u), ["ctrl"]), ["enter"]),
                          mi(qn((L) => Qi(u), ["meta"]), ["enter"])
                        ]
                      }, null, 40, A_), [
                        [zn, u.userInputValue]
                      ]),
                      b("button", {
                        class: "user-input-submit-button",
                        onClick: (L) => Qi(u),
                        disabled: !u.userInputValue || !u.userInputValue.trim()
                      }, " Submit ", 8, T_)
                    ]))
                  ])) : u.shopify_output || u.message_type === "product" ? (k(), A("div", C_, [
                    u.message ? (k(), A("div", {
                      key: 0,
                      innerHTML: S(vi)(((Jo = (Zo = u.shopify_output) == null ? void 0 : Zo.products) == null ? void 0 : Jo.length) > 0 ? Vc(u.message) : u.message),
                      class: "product-message-text"
                    }, null, 8, R_)) : ae("", !0),
                    (Qo = u.shopify_output) != null && Qo.products && u.shopify_output.products.length > 0 ? (k(), A("div", I_, [
                      g[37] || (g[37] = b("h3", { class: "carousel-title" }, "Products", -1)),
                      b("div", L_, [
                        (k(!0), A(De, null, vt(u.shopify_output.products, (L) => {
                          var Xt;
                          return k(), A("div", {
                            key: L.id,
                            class: "product-card-compact carousel-item"
                          }, [
                            (Xt = L.image) != null && Xt.src ? (k(), A("div", O_, [
                              b("img", {
                                src: L.image.src,
                                alt: L.title,
                                class: "product-thumbnail"
                              }, null, 8, P_)
                            ])) : ae("", !0),
                            b("div", N_, [
                              b("div", M_, [
                                b("div", F_, se(L.title), 1),
                                L.variant_title && L.variant_title !== "Default Title" ? (k(), A("div", D_, se(L.variant_title), 1)) : ae("", !0),
                                b("div", B_, se(L.price_formatted || S(a)(L.price, L.currency)), 1)
                              ]),
                              b("div", $_, [
                                b("button", {
                                  class: "view-details-button-compact",
                                  onClick: (or) => {
                                    var ze;
                                    return jc(L, (ze = u.shopify_output) == null ? void 0 : ze.shop_domain);
                                  }
                                }, g[36] || (g[36] = [
                                  dn(" View product ", -1),
                                  b("span", { class: "external-link-icon" }, "↗", -1)
                                ]), 8, U_)
                              ])
                            ])
                          ]);
                        }), 128))
                      ])
                    ])) : !u.message && ((ea = u.shopify_output) != null && ea.products) && u.shopify_output.products.length === 0 ? (k(), A("div", z_, g[38] || (g[38] = [
                      b("p", null, "No products found.", -1)
                    ]))) : !u.message && u.shopify_output && !u.shopify_output.products ? (k(), A("div", H_, g[39] || (g[39] = [
                      b("p", null, "No products to display.", -1)
                    ]))) : ae("", !0)
                  ])) : (k(), A(De, { key: 4 }, [
                    S(_e)(ne) ? (k(), A("div", {
                      key: 0,
                      class: "message-streaming",
                      innerHTML: S(vi)(S(fe)(ne, u.message))
                    }, null, 8, q_)) : (k(), A("div", {
                      key: 1,
                      innerHTML: S(vi)(u.message)
                    }, null, 8, W_)),
                    u.attachments && u.attachments.length > 0 ? (k(), A("div", j_, [
                      (k(!0), A(De, null, vt(u.attachments, (L) => (k(), A("div", {
                        key: L.id,
                        class: "attachment-item"
                      }, [
                        S(T)(L.content_type) ? (k(), A("div", V_, [
                          b("img", {
                            src: S(M)(L.file_url),
                            alt: L.filename,
                            class: "attachment-image",
                            onClick: qn((Xt) => S(_t)({ url: L.file_url, filename: L.filename, type: L.content_type, file_url: S(M)(L.file_url), size: void 0 }), ["stop"]),
                            style: { cursor: "pointer" }
                          }, null, 8, K_),
                          b("div", G_, [
                            b("a", {
                              href: S(M)(L.file_url),
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
                              dn(" " + se(L.filename) + " ", 1),
                              b("span", X_, "(" + se(S(E)(L.file_size)) + ")", 1)
                            ], 8, Y_)
                          ])
                        ])) : (k(), A("a", {
                          key: 1,
                          href: S(M)(L.file_url),
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
                          dn(" " + se(L.filename) + " ", 1),
                          b("span", J_, "(" + se(S(E)(L.file_size)) + ")", 1)
                        ], 8, Z_))
                      ]))), 128))
                    ])) : ae("", !0)
                  ], 64))
                ], 4),
                ni.value && (u.message_type === "bot" || u.message_type === "agent") && u.sources && u.sources.length ? (k(), A("div", Q_, [
                  g[42] || (g[42] = b("span", { class: "citation-label" }, "Sources", -1)),
                  (k(!0), A(De, null, vt(u.sources, (L, Xt) => (k(), A("span", {
                    key: Xt,
                    class: "citation-chip",
                    title: Mo(L)
                  }, se(nr(L)), 9, ey))), 128))
                ])) : ae("", !0),
                b("div", ty, [
                  u.message_type === "user" ? (k(), A("span", ny, " You ")) : ae("", !0)
                ])
              ])
            ], 2);
          }), 128)),
          S(h) ? (k(), A("div", {
            key: 1,
            class: Je(["typing-indicator", { "reading-indicator": ni.value }])
          }, [
            ni.value ? (k(), A(De, { key: 0 }, [
              g[43] || (g[43] = b("div", {
                class: "reading-bars",
                "aria-hidden": "true"
              }, [
                b("span"),
                b("span"),
                b("span")
              ], -1)),
              g[44] || (g[44] = b("span", { class: "reading-label" }, "reading knowledge base", -1))
            ], 64)) : (k(), A("div", {
              key: 1,
              class: "cm-typing-bubble",
              style: Te(S(Y))
            }, g[45] || (g[45] = [
              b("span", { class: "cm-typing-dot" }, null, -1),
              b("span", { class: "cm-typing-dot" }, null, -1),
              b("span", { class: "cm-typing-dot" }, null, -1)
            ]), 4))
          ], 2)) : ae("", !0)
        ], 512), [
          [uh, !Zn.value]
        ]),
        nu.value ? (k(), A("div", sy, [
          (k(!0), A(De, null, vt(er.value, (u) => (k(), A("button", {
            key: u,
            type: "button",
            class: "cm-quick-action",
            disabled: !$t.value,
            onClick: (ne) => fs(u)
          }, se(u), 9, iy))), 128))
        ])) : ae("", !0),
        !ht.value && !Zn.value ? (k(), A("div", {
          key: 5,
          class: Je(["chat-input", { "ask-anything-input": Ht.value }])
        }, [
          b("input", {
            ref_key: "fileInputRef",
            ref: $e,
            type: "file",
            accept: Iy,
            multiple: "",
            style: { display: "none" },
            onChange: g[7] || (g[7] = //@ts-ignore
            (...u) => S(ie) && S(ie)(...u))
          }, null, 544),
          S(nt).length > 0 ? (k(), A("div", ry, [
            (k(!0), A(De, null, vt(S(nt), (u, ne) => (k(), A("div", {
              key: ne,
              class: "file-preview-widget"
            }, [
              b("div", oy, [
                S(Xs)(u.type) ? (k(), A("img", {
                  key: 0,
                  src: S(X)(u),
                  alt: u.filename,
                  class: "file-preview-image-widget",
                  onClick: qn((ke) => S(_t)(u), ["stop"]),
                  style: { cursor: "pointer" }
                }, null, 8, ay)) : (k(), A("div", {
                  key: 1,
                  class: "file-preview-icon-widget",
                  onClick: qn((ke) => S(_t)(u), ["stop"]),
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
                ]), 8, ly))
              ]),
              b("div", cy, [
                b("div", uy, se(u.filename), 1),
                b("div", fy, se(S(E)(u.size)), 1)
              ]),
              b("button", {
                type: "button",
                class: "file-preview-remove-widget",
                onClick: (ke) => S(gt)(ne),
                title: "Remove file"
              }, " × ", 8, hy)
            ]))), 128))
          ])) : ae("", !0),
          Co.value ? (k(), A("div", dy, g[47] || (g[47] = [
            b("div", { class: "upload-spinner-widget" }, null, -1),
            b("span", { class: "upload-text-widget" }, "Uploading files...", -1)
          ]))) : ae("", !0),
          b("div", py, [
            An(b("input", {
              "onUpdate:modelValue": g[8] || (g[8] = (u) => te.value = u),
              type: "text",
              placeholder: Nn.value,
              onKeypress: Nt,
              onInput: Ke,
              onChange: Ke,
              onPaste: g[9] || (g[9] = //@ts-ignore
              (...u) => S(Fe) && S(Fe)(...u)),
              onDrop: g[10] || (g[10] = //@ts-ignore
              (...u) => S(xe) && S(xe)(...u)),
              onDragover: g[11] || (g[11] = //@ts-ignore
              (...u) => S(Se) && S(Se)(...u)),
              onDragleave: g[12] || (g[12] = //@ts-ignore
              (...u) => S(Ye) && S(Ye)(...u)),
              disabled: !$t.value,
              class: Je({ disabled: !$t.value, "ask-anything-field": Ht.value })
            }, null, 42, gy), [
              [zn, te.value]
            ]),
            Kc.value ? (k(), A("button", {
              key: 0,
              type: "button",
              class: "attach-button",
              disabled: Co.value,
              onClick: g[13] || (g[13] = //@ts-ignore
              (...u) => S(Gt) && S(Gt)(...u)),
              title: `Attach files (${S(nt).length}/${tl} used) or paste screenshots`
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
            ]), 8, my)) : ae("", !0),
            b("button", {
              class: Je(["send-button", { "ask-anything-send": Ht.value }]),
              style: Te(S(Q)),
              onClick: tn,
              disabled: !te.value.trim() && S(nt).length === 0 || !$t.value
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
            ]), 14, _y)
          ])
        ], 2)) : ht.value && !Zn.value ? (k(), A("div", yy, [
          b("div", vy, [
            g[50] || (g[50] = b("p", { class: "ended-text" }, "This chat has ended.", -1)),
            b("button", {
              class: "start-new-conversation-button",
              style: Te(S(Q)),
              onClick: Zc
            }, " Click here to start a new conversation ", 4)
          ])
        ])) : ae("", !0),
        No.value ? (k(), A("div", {
          key: 7,
          class: "ai-disclaimer",
          style: Te(S(re))
        }, se(S(Wa)), 5)) : ae("", !0),
        b("div", {
          class: "powered-by",
          style: Te(S(re))
        }, g[51] || (g[51] = [
          Un('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-260c031d><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-260c031d></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-260c031d></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-260c031d><span class="cm-powered-prefix" data-v-260c031d>Powered by </span><strong class="cm-brand" data-v-260c031d>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 6)) : ae("", !0),
      zt.value ? (k(), A("div", by, [
        b("div", wy, [
          g[52] || (g[52] = b("h3", null, "Rate your conversation", -1)),
          b("div", ky, [
            (k(), A(De, null, vt(5, (u) => b("button", {
              key: u,
              onClick: (ne) => Fn.value = u,
              class: Je([{ active: u <= Fn.value }, "star-button"])
            }, " ★ ", 10, xy)), 64))
          ]),
          An(b("textarea", {
            "onUpdate:modelValue": g[14] || (g[14] = (u) => Yn.value = u),
            placeholder: "Additional feedback (optional)",
            class: "rating-feedback"
          }, null, 512), [
            [zn, Yn.value]
          ]),
          b("div", Ay, [
            b("button", {
              onClick: g[15] || (g[15] = (u) => d.submitRating(Fn.value, Yn.value)),
              disabled: !Fn.value,
              class: "submit-button",
              style: Te(S(Q))
            }, " Submit ", 12, Ty),
            b("button", {
              onClick: g[16] || (g[16] = (u) => zt.value = !1),
              class: "skip-rating"
            }, " Skip ")
          ])
        ])
      ])) : ae("", !0),
      S(f) ? (k(), A("div", {
        key: 9,
        class: "preview-modal-overlay",
        onClick: g[19] || (g[19] = //@ts-ignore
        (...u) => S(Ue) && S(Ue)(...u))
      }, [
        b("div", {
          class: "preview-modal-content",
          onClick: g[18] || (g[18] = qn(() => {
          }, ["stop"]))
        }, [
          b("button", {
            class: "preview-modal-close",
            onClick: g[17] || (g[17] = //@ts-ignore
            (...u) => S(Ue) && S(Ue)(...u))
          }, "×"),
          S(v) && S(Xs)(S(v).type) ? (k(), A("div", Sy, [
            b("img", {
              src: S(X)(S(v)),
              alt: S(v).filename,
              class: "preview-modal-image"
            }, null, 8, Ey),
            b("div", Cy, se(S(v).filename), 1)
          ])) : ae("", !0)
        ])
      ])) : ae("", !0)
    ], 6)) : (k(), A("div", Ry));
  }
}), Oy = /* @__PURE__ */ xc(Ly, [["__scopeId", "data-v-260c031d"]]);
window.process || (window.process = { env: { NODE_ENV: "production" } });
const Wt = window.__INITIAL_DATA__, Bc = new URL(window.location.href), $c = Bc.searchParams.get("preview") === "true", Uc = (e) => {
  const t = Bc.searchParams.get(e);
  if (!(!t || t === "undefined" || t.trim() === ""))
    return t;
}, Py = $c ? Uc("widget_id") || (Wt == null ? void 0 : Wt.widgetId) || void 0 : (Wt == null ? void 0 : Wt.widgetId) || void 0, Ny = $c ? (Wt == null ? void 0 : Wt.initialToken) || Uc("token") || void 0 : (Wt == null ? void 0 : Wt.initialToken) || void 0, My = Ih(Oy, {
  widgetId: Py,
  token: Ny || void 0,
  initialAuthError: null
  // Let backend determine if auth is required
});
My.mount("#app");

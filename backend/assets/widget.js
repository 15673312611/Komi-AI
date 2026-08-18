var vu = Object.defineProperty;
var bu = (e, t, n) => t in e ? vu(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var Je = (e, t, n) => bu(e, typeof t != "symbol" ? t + "" : t, n);
/**
* @vue/shared v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function so(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const Qe = {}, ns = [], on = () => {
}, wu = () => !1, zi = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), io = (e) => e.startsWith("onUpdate:"), bt = Object.assign, ro = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, ku = Object.prototype.hasOwnProperty, qe = (e, t) => ku.call(e, t), pe = Array.isArray, ss = (e) => Hi(e) === "[object Map]", ll = (e) => Hi(e) === "[object Set]", _e = (e) => typeof e == "function", ct = (e) => typeof e == "string", Mn = (e) => typeof e == "symbol", it = (e) => e !== null && typeof e == "object", cl = (e) => (it(e) || _e(e)) && _e(e.then) && _e(e.catch), ul = Object.prototype.toString, Hi = (e) => ul.call(e), xu = (e) => Hi(e).slice(8, -1), fl = (e) => Hi(e) === "[object Object]", oo = (e) => ct(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Ps = /* @__PURE__ */ so(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), qi = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return (n) => t[n] || (t[n] = e(n));
}, Au = /-(\w)/g, On = qi(
  (e) => e.replace(Au, (t, n) => n ? n.toUpperCase() : "")
), Tu = /\B([A-Z])/g, Fn = qi(
  (e) => e.replace(Tu, "-$1").toLowerCase()
), hl = qi((e) => e.charAt(0).toUpperCase() + e.slice(1)), pr = qi(
  (e) => e ? `on${hl(e)}` : ""
), In = (e, t) => !Object.is(e, t), mi = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, Pr = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, Mr = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
};
let aa;
const Wi = () => aa || (aa = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function ke(e) {
  if (pe(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], i = ct(s) ? Ru(s) : ke(s);
      if (i)
        for (const r in i)
          t[r] = i[r];
    }
    return t;
  } else if (ct(e) || it(e))
    return e;
}
const Su = /;(?![^(]*\))/g, Eu = /:([^]+)/, Cu = /\/\*[^]*?\*\//g;
function Ru(e) {
  const t = {};
  return e.replace(Cu, "").split(Su).forEach((n) => {
    if (n) {
      const s = n.split(Eu);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function ze(e) {
  let t = "";
  if (ct(e))
    t = e;
  else if (pe(e))
    for (let n = 0; n < e.length; n++) {
      const s = ze(e[n]);
      s && (t += s + " ");
    }
  else if (it(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const Iu = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", Lu = /* @__PURE__ */ so(Iu);
function dl(e) {
  return !!e || e === "";
}
const pl = (e) => !!(e && e.__v_isRef === !0), ee = (e) => ct(e) ? e : e == null ? "" : pe(e) || it(e) && (e.toString === ul || !_e(e.toString)) ? pl(e) ? ee(e.value) : JSON.stringify(e, gl, 2) : String(e), gl = (e, t) => pl(t) ? gl(e, t.value) : ss(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, i], r) => (n[gr(s, r) + " =>"] = i, n),
    {}
  )
} : ll(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => gr(n))
} : Mn(t) ? gr(t) : it(t) && !pe(t) && !fl(t) ? String(t) : t, gr = (e, t = "") => {
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
class Ou {
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
function Nu() {
  return Nt;
}
let nt;
const mr = /* @__PURE__ */ new WeakSet();
class ml {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, Nt && Nt.active && Nt.effects.push(this);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, mr.has(this) && (mr.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || yl(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, la(this), vl(this);
    const t = nt, n = Qt;
    nt = this, Qt = !0;
    try {
      return this.fn();
    } finally {
      bl(this), nt = t, Qt = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        co(t);
      this.deps = this.depsTail = void 0, la(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? mr.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    Fr(this) && this.run();
  }
  get dirty() {
    return Fr(this);
  }
}
let _l = 0, Ms, Fs;
function yl(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = Fs, Fs = e;
    return;
  }
  e.next = Ms, Ms = e;
}
function ao() {
  _l++;
}
function lo() {
  if (--_l > 0)
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
function vl(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function bl(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const i = s.prevDep;
    s.version === -1 ? (s === n && (n = i), co(s), Pu(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = i;
  }
  e.deps = t, e.depsTail = n;
}
function Fr(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (wl(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function wl(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Hs) || (e.globalVersion = Hs, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Fr(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = nt, s = Qt;
  nt = e, Qt = !0;
  try {
    vl(e);
    const i = e.fn(e._value);
    (t.version === 0 || In(i, e._value)) && (e.flags |= 128, e._value = i, t.version++);
  } catch (i) {
    throw t.version++, i;
  } finally {
    nt = n, Qt = s, bl(e), e.flags &= -3;
  }
}
function co(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: i } = e;
  if (s && (s.nextSub = i, e.prevSub = void 0), i && (i.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let r = n.computed.deps; r; r = r.nextDep)
      co(r, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Pu(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Qt = !0;
const kl = [];
function bn() {
  kl.push(Qt), Qt = !1;
}
function wn() {
  const e = kl.pop();
  Qt = e === void 0 ? !0 : e;
}
function la(e) {
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
class Mu {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class uo {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!nt || !Qt || nt === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== nt)
      n = this.activeLink = new Mu(nt, this), nt.deps ? (n.prevDep = nt.depsTail, nt.depsTail.nextDep = n, nt.depsTail = n) : nt.deps = nt.depsTail = n, xl(n);
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
    ao();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      lo();
    }
  }
}
function xl(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        xl(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const Dr = /* @__PURE__ */ new WeakMap(), jn = Symbol(
  ""
), Br = Symbol(
  ""
), qs = Symbol(
  ""
);
function yt(e, t, n) {
  if (Qt && nt) {
    let s = Dr.get(e);
    s || Dr.set(e, s = /* @__PURE__ */ new Map());
    let i = s.get(n);
    i || (s.set(n, i = new uo()), i.map = s, i.key = n), i.track();
  }
}
function mn(e, t, n, s, i, r) {
  const o = Dr.get(e);
  if (!o) {
    Hs++;
    return;
  }
  const a = (l) => {
    l && l.trigger();
  };
  if (ao(), t === "clear")
    o.forEach(a);
  else {
    const l = pe(e), d = l && oo(n);
    if (l && n === "length") {
      const c = Number(s);
      o.forEach((w, k) => {
        (k === "length" || k === qs || !Mn(k) && k >= c) && a(w);
      });
    } else
      switch ((n !== void 0 || o.has(void 0)) && a(o.get(n)), d && a(o.get(qs)), t) {
        case "add":
          l ? d && a(o.get("length")) : (a(o.get(jn)), ss(e) && a(o.get(Br)));
          break;
        case "delete":
          l || (a(o.get(jn)), ss(e) && a(o.get(Br)));
          break;
        case "set":
          ss(e) && a(o.get(jn));
          break;
      }
  }
  lo();
}
function Qn(e) {
  const t = He(e);
  return t === e ? t : (yt(t, "iterate", qs), Vt(e) ? t : t.map(mt));
}
function ji(e) {
  return yt(e = He(e), "iterate", qs), e;
}
const Fu = {
  __proto__: null,
  [Symbol.iterator]() {
    return _r(this, Symbol.iterator, mt);
  },
  concat(...e) {
    return Qn(this).concat(
      ...e.map((t) => pe(t) ? Qn(t) : t)
    );
  },
  entries() {
    return _r(this, "entries", (e) => (e[1] = mt(e[1]), e));
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
    return yr(this, "includes", e);
  },
  indexOf(...e) {
    return yr(this, "indexOf", e);
  },
  join(e) {
    return Qn(this).join(e);
  },
  // keys() iterator only reads `length`, no optimisation required
  lastIndexOf(...e) {
    return yr(this, "lastIndexOf", e);
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
    return ca(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return ca(this, "reduceRight", e, t);
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
    return _r(this, "values", mt);
  }
};
function _r(e, t, n) {
  const s = ji(e), i = s[t]();
  return s !== e && !Vt(e) && (i._next = i.next, i.next = () => {
    const r = i._next();
    return r.value && (r.value = n(r.value)), r;
  }), i;
}
const Du = Array.prototype;
function hn(e, t, n, s, i, r) {
  const o = ji(e), a = o !== e && !Vt(e), l = o[t];
  if (l !== Du[t]) {
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
function ca(e, t, n, s) {
  const i = ji(e);
  let r = n;
  return i !== e && (Vt(e) ? n.length > 3 && (r = function(o, a, l) {
    return n.call(this, o, a, l, e);
  }) : r = function(o, a, l) {
    return n.call(this, o, mt(a), l, e);
  }), i[t](r, ...s);
}
function yr(e, t, n) {
  const s = He(e);
  yt(s, "iterate", qs);
  const i = s[t](...n);
  return (i === -1 || i === !1) && po(n[0]) ? (n[0] = He(n[0]), s[t](...n)) : i;
}
function ys(e, t, n = []) {
  bn(), ao();
  const s = He(e)[t].apply(e, n);
  return lo(), wn(), s;
}
const Bu = /* @__PURE__ */ so("__proto__,__v_isRef,__isVue"), Al = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Mn)
);
function $u(e) {
  Mn(e) || (e = String(e));
  const t = He(this);
  return yt(t, "has", e), t.hasOwnProperty(e);
}
class Tl {
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
      return s === (i ? r ? Yu : Rl : r ? Cl : El).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const o = pe(t);
    if (!i) {
      let l;
      if (o && (l = Fu[n]))
        return l;
      if (n === "hasOwnProperty")
        return $u;
    }
    const a = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      vt(t) ? t : s
    );
    return (Mn(n) ? Al.has(n) : Bu(n)) || (i || yt(t, "get", n), r) ? a : vt(a) ? o && oo(n) ? a : a.value : it(a) ? i ? Il(a) : Vi(a) : a;
  }
}
class Sl extends Tl {
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
    const o = pe(t) && oo(n) ? Number(n) < t.length : qe(t, n), a = Reflect.set(
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
    return (!Mn(n) || !Al.has(n)) && yt(t, "has", n), s;
  }
  ownKeys(t) {
    return yt(
      t,
      "iterate",
      pe(t) ? "length" : jn
    ), Reflect.ownKeys(t);
  }
}
class Uu extends Tl {
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
const zu = /* @__PURE__ */ new Sl(), Hu = /* @__PURE__ */ new Uu(), qu = /* @__PURE__ */ new Sl(!0);
const $r = (e) => e, li = (e) => Reflect.getPrototypeOf(e);
function Wu(e, t, n) {
  return function(...s) {
    const i = this.__v_raw, r = He(i), o = ss(r), a = e === "entries" || e === Symbol.iterator && o, l = e === "keys" && o, d = i[e](...s), c = n ? $r : t ? Ii : mt;
    return !t && yt(
      r,
      "iterate",
      l ? Br : jn
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
function ju(e, t) {
  const n = {
    get(i) {
      const r = this.__v_raw, o = He(r), a = He(i);
      e || (In(i, a) && yt(o, "get", i), yt(o, "get", a));
      const { has: l } = li(o), d = t ? $r : e ? Ii : mt;
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
      const o = this, a = o.__v_raw, l = He(a), d = t ? $r : e ? Ii : mt;
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
    n[i] = Wu(i, e, t);
  }), n;
}
function fo(e, t) {
  const n = ju(e, t);
  return (s, i, r) => i === "__v_isReactive" ? !e : i === "__v_isReadonly" ? e : i === "__v_raw" ? s : Reflect.get(
    qe(n, i) && i in s ? n : s,
    i,
    r
  );
}
const Vu = {
  get: /* @__PURE__ */ fo(!1, !1)
}, Ku = {
  get: /* @__PURE__ */ fo(!1, !0)
}, Gu = {
  get: /* @__PURE__ */ fo(!0, !1)
};
const El = /* @__PURE__ */ new WeakMap(), Cl = /* @__PURE__ */ new WeakMap(), Rl = /* @__PURE__ */ new WeakMap(), Yu = /* @__PURE__ */ new WeakMap();
function Xu(e) {
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
function Zu(e) {
  return e.__v_skip || !Object.isExtensible(e) ? 0 : Xu(xu(e));
}
function Vi(e) {
  return Nn(e) ? e : ho(
    e,
    !1,
    zu,
    Vu,
    El
  );
}
function Ju(e) {
  return ho(
    e,
    !1,
    qu,
    Ku,
    Cl
  );
}
function Il(e) {
  return ho(
    e,
    !0,
    Hu,
    Gu,
    Rl
  );
}
function ho(e, t, n, s, i) {
  if (!it(e) || e.__v_raw && !(t && e.__v_isReactive))
    return e;
  const r = Zu(e);
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
function po(e) {
  return e ? !!e.__v_raw : !1;
}
function He(e) {
  const t = e && e.__v_raw;
  return t ? He(t) : e;
}
function Qu(e) {
  return !qe(e, "__v_skip") && Object.isExtensible(e) && Pr(e, "__v_skip", !0), e;
}
const mt = (e) => it(e) ? Vi(e) : e, Ii = (e) => it(e) ? Il(e) : e;
function vt(e) {
  return e ? e.__v_isRef === !0 : !1;
}
function ie(e) {
  return ef(e, !1);
}
function ef(e, t) {
  return vt(e) ? e : new tf(e, t);
}
class tf {
  constructor(t, n) {
    this.dep = new uo(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : He(t), this._value = n ? t : mt(t), this.__v_isShallow = n;
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
const nf = {
  get: (e, t, n) => t === "__v_raw" ? e : E(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const i = e[t];
    return vt(i) && !vt(n) ? (i.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function Ll(e) {
  return is(e) ? e : new Proxy(e, nf);
}
class sf {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new uo(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Hs - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    nt !== this)
      return yl(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return wl(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
function rf(e, t, n = !1) {
  let s, i;
  return _e(e) ? s = e : (s = e.get, i = e.set), new sf(s, i, n);
}
const ui = {}, Li = /* @__PURE__ */ new WeakMap();
let qn;
function of(e, t = !1, n = qn) {
  if (n) {
    let s = Li.get(n);
    s || Li.set(n, s = []), s.push(e);
  }
}
function af(e, t, n = Qe) {
  const { immediate: s, deep: i, once: r, scheduler: o, augmentJob: a, call: l } = n, d = (T) => i ? T : Vt(T) || i === !1 || i === 0 ? _n(T, 1) : _n(T);
  let c, w, k, D, F = !1, G = !1;
  if (vt(e) ? (w = () => e.value, F = Vt(e)) : is(e) ? (w = () => d(e), F = !0) : pe(e) ? (G = !0, F = e.some((T) => is(T) || Vt(T)), w = () => e.map((T) => {
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
  const H = Nu(), ce = () => {
    c.stop(), H && H.active && ro(H.effects, c);
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
        if (i || F || (G ? L.some((V, K) => In(V, ue[K])) : In(L, ue))) {
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
  return a && a(ge), c = new ml(w), c.scheduler = o ? () => o(ge, !1) : ge, D = (T) => of(T, !1, c), k = c.onStop = () => {
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
  else if (ll(e) || ss(e))
    e.forEach((s) => {
      _n(s, t, n);
    });
  else if (fl(e)) {
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
    return i && cl(i) && i.catch((r) => {
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
  lf(e, n, i, s, o);
}
function lf(e, t, n, s = !0, i = !1) {
  if (i)
    throw e;
  console.error(e);
}
const St = [];
let sn = -1;
const rs = [];
let Cn = null, es = 0;
const Ol = /* @__PURE__ */ Promise.resolve();
let Oi = null;
function os(e) {
  const t = Oi || Ol;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function cf(e) {
  let t = sn + 1, n = St.length;
  for (; t < n; ) {
    const s = t + n >>> 1, i = St[s], r = Ws(i);
    r < e || r === e && i.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function go(e) {
  if (!(e.flags & 1)) {
    const t = Ws(e), n = St[St.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= Ws(n) ? St.push(e) : St.splice(cf(t), 0, e), e.flags |= 1, Nl();
  }
}
function Nl() {
  Oi || (Oi = Ol.then(Ml));
}
function uf(e) {
  pe(e) ? rs.push(...e) : Cn && e.id === -1 ? Cn.splice(es + 1, 0, e) : e.flags & 1 || (rs.push(e), e.flags |= 1), Nl();
}
function ua(e, t, n = sn + 1) {
  for (; n < St.length; n++) {
    const s = St[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid)
        continue;
      St.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function Pl(e) {
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
function Ml(e) {
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
    sn = -1, St.length = 0, Pl(), Oi = null, (St.length || rs.length) && Ml();
  }
}
let jt = null, Fl = null;
function Ni(e) {
  const t = jt;
  return jt = e, Fl = e && e.type.__scopeId || null, t;
}
function ff(e, t = jt, n) {
  if (!t || e._n)
    return e;
  const s = (...i) => {
    s._d && va(-1);
    const r = Ni(t);
    let o;
    try {
      o = e(...i);
    } finally {
      Ni(r), s._d && va(1);
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
const hf = Symbol("_vte"), df = (e) => e.__isTeleport;
function mo(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, mo(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function Dl(e, t) {
  return _e(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    bt({ name: e.name }, t, { setup: e })
  ) : e;
}
function Bl(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function Ds(e, t, n, s, i = !1) {
  if (pe(e)) {
    e.forEach(
      (F, G) => Ds(
        F,
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
  const r = s.shapeFlag & 4 ? Ji(s.component) : s.el, o = i ? null : r, { i: a, r: l } = e, d = t && t.r, c = a.refs === Qe ? a.refs = {} : a.refs, w = a.setupState, k = He(w), D = w === Qe ? () => !1 : (F) => qe(k, F);
  if (d != null && d !== l && (ct(d) ? (c[d] = null, D(d) && (w[d] = null)) : vt(d) && (d.value = null)), _e(l))
    Gs(l, a, 12, [o, c]);
  else {
    const F = ct(l), G = vt(l);
    if (F || G) {
      const H = () => {
        if (e.f) {
          const ce = F ? D(l) ? w[l] : c[l] : l.value;
          i ? pe(ce) && ro(ce, r) : pe(ce) ? ce.includes(r) || ce.push(r) : F ? (c[l] = [r], D(l) && (w[l] = c[l])) : (l.value = [r], e.k && (c[e.k] = l.value));
        } else F ? (c[l] = o, D(l) && (w[l] = o)) : G && (l.value = o, e.k && (c[e.k] = o));
      };
      o ? (H.id = -1, Bt(H, n)) : H();
    }
  }
}
Wi().requestIdleCallback;
Wi().cancelIdleCallback;
const Bs = (e) => !!e.type.__asyncLoader, $l = (e) => e.type.__isKeepAlive;
function pf(e, t) {
  Ul(e, "a", t);
}
function gf(e, t) {
  Ul(e, "da", t);
}
function Ul(e, t, n = Et) {
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
      $l(i.parent.vnode) && mf(s, t, n, i), i = i.parent;
  }
}
function mf(e, t, n, s) {
  const i = Gi(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  Ys(() => {
    ro(s[t], i);
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
}, _f = kn("bm"), Yi = kn("m"), yf = kn(
  "bu"
), vf = kn("u"), zl = kn(
  "bum"
), Ys = kn("um"), bf = kn(
  "sp"
), wf = kn("rtg"), kf = kn("rtc");
function xf(e, t = Et) {
  Gi("ec", e, t);
}
const Af = Symbol.for("v-ndc");
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
const Ur = (e) => e ? cc(e) ? Ji(e) : Ur(e.parent) : null, $s = (
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
    $parent: (e) => Ur(e.parent),
    $root: (e) => Ur(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => ql(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      go(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = os.bind(e.proxy)),
    $watch: (e) => Vf.bind(e)
  })
), vr = (e, t) => e !== Qe && !e.__isScriptSetup && qe(e, t), Tf = {
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
        if (vr(s, t))
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
        zr && (o[t] = 0);
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
    return vr(i, t) ? (i[t] = n, !0) : s !== Qe && qe(s, t) ? (s[t] = n, !0) : qe(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (r[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: i, propsOptions: r }
  }, o) {
    let a;
    return !!n[o] || e !== Qe && qe(e, o) || vr(t, o) || (a = r[0]) && qe(a, o) || qe(s, o) || qe($s, o) || qe(i.config.globalProperties, o);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : qe(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function fa(e) {
  return pe(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let zr = !0;
function Sf(e) {
  const t = ql(e), n = e.proxy, s = e.ctx;
  zr = !1, t.beforeCreate && ha(t.beforeCreate, e, "bc");
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
    updated: F,
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
  if (d && Ef(d, s, null), o)
    for (const de in o) {
      const ae = o[de];
      _e(ae) && (s[de] = ae.bind(n));
    }
  if (i) {
    const de = i.call(n, n);
    it(de) && (e.data = Vi(de));
  }
  if (zr = !0, r)
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
      Hl(a[de], s, n, de);
  if (l) {
    const de = _e(l) ? l.call(n) : l;
    Reflect.ownKeys(de).forEach((ae) => {
      Nf(ae, de[ae]);
    });
  }
  c && ha(c, e, "c");
  function fe(de, ae) {
    pe(ae) ? ae.forEach((Te) => de(Te.bind(n))) : ae && de(ae.bind(n));
  }
  if (fe(_f, w), fe(Yi, k), fe(yf, D), fe(vf, F), fe(pf, G), fe(gf, H), fe(xf, xe), fe(kf, V), fe(wf, K), fe(zl, ue), fe(Ys, T), fe(bf, Pe), pe(Ke))
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
  L && e.render === on && (e.render = L), Ce != null && (e.inheritAttrs = Ce), ye && (e.components = ye), Ye && (e.directives = Ye), Pe && Bl(e);
}
function Ef(e, t, n = on) {
  pe(e) && (e = Hr(e));
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
function ha(e, t, n) {
  cn(
    pe(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function Hl(e, t, n, s) {
  let i = s.includes(".") ? nc(n, s) : () => n[s];
  if (ct(e)) {
    const r = t[e];
    _e(r) && Wt(i, r);
  } else if (_e(e))
    Wt(i, e.bind(n));
  else if (it(e))
    if (pe(e))
      e.forEach((r) => Hl(r, t, n, s));
    else {
      const r = _e(e.handler) ? e.handler.bind(n) : t[e.handler];
      _e(r) && Wt(i, r, e);
    }
}
function ql(e) {
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
      const a = Cf[o] || n && n[o];
      e[o] = a ? a(e[o], t[o]) : t[o];
    }
  return e;
}
const Cf = {
  data: da,
  props: pa,
  emits: pa,
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
  watch: If,
  // provide / inject
  provide: da,
  inject: Rf
};
function da(e, t) {
  return t ? e ? function() {
    return bt(
      _e(e) ? e.call(this, this) : e,
      _e(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function Rf(e, t) {
  return Ls(Hr(e), Hr(t));
}
function Hr(e) {
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
function pa(e, t) {
  return e ? pe(e) && pe(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : bt(
    /* @__PURE__ */ Object.create(null),
    fa(e),
    fa(t ?? {})
  ) : t;
}
function If(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = bt(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = Tt(e[s], t[s]);
  return n;
}
function Wl() {
  return {
    app: null,
    config: {
      isNativeTag: wu,
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
let Lf = 0;
function Of(e, t) {
  return function(s, i = null) {
    _e(s) || (s = bt({}, s)), i != null && !it(i) && (i = null);
    const r = Wl(), o = /* @__PURE__ */ new WeakSet(), a = [];
    let l = !1;
    const d = r.app = {
      _uid: Lf++,
      _component: s,
      _props: i,
      _container: null,
      _context: r,
      _instance: null,
      version: dh,
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
function Nf(e, t) {
  if (Et) {
    let n = Et.provides;
    const s = Et.parent && Et.parent.provides;
    s === n && (n = Et.provides = Object.create(s)), n[e] = t;
  }
}
function _i(e, t, n = !1) {
  const s = ah();
  if (s || as) {
    let i = as ? as._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (i && e in i)
      return i[e];
    if (arguments.length > 1)
      return n && _e(t) ? t.call(s && s.proxy) : t;
  }
}
const jl = {}, Vl = () => Object.create(jl), Kl = (e) => Object.getPrototypeOf(e) === jl;
function Pf(e, t, n, s = !1) {
  const i = {}, r = Vl();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Gl(e, t, i, r);
  for (const o in e.propsOptions[0])
    o in i || (i[o] = void 0);
  n ? e.props = s ? i : Ju(i) : e.type.props ? e.props = i : e.props = r, e.attrs = r;
}
function Mf(e, t, n, s) {
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
            const F = On(k);
            i[F] = qr(
              l,
              a,
              F,
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
    Gl(e, t, i, r) && (d = !0);
    let c;
    for (const w in a)
      (!t || // for camelCase
      !qe(t, w) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((c = Fn(w)) === w || !qe(t, c))) && (l ? n && // for camelCase
      (n[w] !== void 0 || // for kebab-case
      n[c] !== void 0) && (i[w] = qr(
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
function Gl(e, t, n, s) {
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
      n[w] = qr(
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
function qr(e, t, n, s, i, r) {
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
const Ff = /* @__PURE__ */ new WeakMap();
function Yl(e, t, n = !1) {
  const s = n ? Ff : t.propsCache, i = s.get(e);
  if (i)
    return i;
  const r = e.props, o = {}, a = [];
  let l = !1;
  if (!_e(e)) {
    const c = (w) => {
      l = !0;
      const [k, D] = Yl(w, t, !0);
      bt(o, k), D && a.push(...D);
    };
    !n && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  if (!r && !l)
    return it(e) && s.set(e, ns), ns;
  if (pe(r))
    for (let c = 0; c < r.length; c++) {
      const w = On(r[c]);
      ga(w) && (o[w] = Qe);
    }
  else if (r)
    for (const c in r) {
      const w = On(c);
      if (ga(w)) {
        const k = r[c], D = o[w] = pe(k) || _e(k) ? { type: k } : bt({}, k), F = D.type;
        let G = !1, H = !0;
        if (pe(F))
          for (let ce = 0; ce < F.length; ++ce) {
            const ue = F[ce], ge = _e(ue) && ue.name;
            if (ge === "Boolean") {
              G = !0;
              break;
            } else ge === "String" && (H = !1);
          }
        else
          G = _e(F) && F.name === "Boolean";
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
function ga(e) {
  return e[0] !== "$" && !Ps(e);
}
const _o = (e) => e === "_" || e === "__" || e === "_ctx" || e === "$stable", yo = (e) => pe(e) ? e.map(rn) : [rn(e)], Df = (e, t, n) => {
  if (t._n)
    return t;
  const s = ff((...i) => yo(t(...i)), n);
  return s._c = !1, s;
}, Xl = (e, t, n) => {
  const s = e._ctx;
  for (const i in e) {
    if (_o(i)) continue;
    const r = e[i];
    if (_e(r))
      t[i] = Df(i, r, s);
    else if (r != null) {
      const o = yo(r);
      t[i] = () => o;
    }
  }
}, Zl = (e, t) => {
  const n = yo(t);
  e.slots.default = () => n;
}, Jl = (e, t, n) => {
  for (const s in t)
    (n || !_o(s)) && (e[s] = t[s]);
}, Bf = (e, t, n) => {
  const s = e.slots = Vl();
  if (e.vnode.shapeFlag & 32) {
    const i = t.__;
    i && Pr(s, "__", i, !0);
    const r = t._;
    r ? (Jl(s, t, n), n && Pr(s, "_", r, !0)) : Xl(t, s);
  } else t && Zl(e, t);
}, $f = (e, t, n) => {
  const { vnode: s, slots: i } = e;
  let r = !0, o = Qe;
  if (s.shapeFlag & 32) {
    const a = t._;
    a ? n && a === 1 ? r = !1 : Jl(i, t, n) : (r = !t.$stable, Xl(t, i)), o = t;
  } else t && (Zl(e, t), o = { default: 1 });
  if (r)
    for (const a in i)
      !_o(a) && o[a] == null && delete i[a];
}, Bt = Qf;
function Uf(e) {
  return zf(e);
}
function zf(e, t) {
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
    insertStaticContent: F
  } = e, G = (p, m, v, N = null, R = null, I = null, U = void 0, z = null, B = !!m.dynamicChildren) => {
    if (p === m)
      return;
    p && !vs(p, m) && (N = ut(p), Le(p, R, I, !0), p = null), m.patchFlag === -2 && (B = !1, m.dynamicChildren = null);
    const { type: M, ref: J, shapeFlag: q } = m;
    switch (M) {
      case Zi:
        H(p, m, v, N);
        break;
      case Pn:
        ce(p, m, v, N);
        break;
      case yi:
        p == null && ue(m, v, N, U);
        break;
      case Fe:
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
        ) : (q & 64 || q & 128) && M.process(
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
    [p.el, p.anchor] = F(
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
    let B, M;
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
      br(p, I),
      U,
      z
    ), te && $n(p, null, N, "created"), K(B, p, p.scopeId, U, N), J) {
      for (const me in J)
        me !== "value" && !Ps(me) && r(B, me, null, J[me], I, N);
      "value" in J && r(B, "value", null, J.value, I), (M = J.onVnodeBeforeMount) && tn(M, N, p);
    }
    te && $n(p, null, N, "beforeMount");
    const re = Hf(R, Z);
    re && Z.beforeEnter(B), s(B, m, v), ((M = J && J.onVnodeMounted) || re || te) && Bt(() => {
      M && tn(M, N, p), re && Z.enter(B), te && $n(p, null, N, "mounted");
    }, R);
  }, K = (p, m, v, N, R) => {
    if (v && D(p, v), N)
      for (let I = 0; I < N.length; I++)
        D(p, N[I]);
    if (R) {
      let I = R.subTree;
      if (m === I || ic(I.type) && (I.ssContent === m || I.ssFallback === m)) {
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
    for (let M = B; M < p.length; M++) {
      const J = p[M] = z ? Rn(p[M]) : rn(p[M]);
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
    let { patchFlag: B, dynamicChildren: M, dirs: J } = m;
    B |= p.patchFlag & 16;
    const q = p.props || Qe, Z = m.props || Qe;
    let te;
    if (v && Un(v, !1), (te = Z.onVnodeBeforeUpdate) && tn(te, v, m, p), J && $n(m, p, v, "beforeUpdate"), v && Un(v, !0), (q.innerHTML && Z.innerHTML == null || q.textContent && Z.textContent == null) && c(z, ""), M ? Ke(
      p.dynamicChildren,
      M,
      z,
      v,
      N,
      br(m, R),
      I
    ) : U || ae(
      p,
      m,
      z,
      null,
      v,
      N,
      br(m, R),
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
    } else !U && M == null && Ce(z, q, Z, v, R);
    ((te = Z.onVnodeUpdated) || J) && Bt(() => {
      te && tn(te, v, m, p), J && $n(m, p, v, "updated");
    }, N);
  }, Ke = (p, m, v, N, R, I, U) => {
    for (let z = 0; z < m.length; z++) {
      const B = p[z], M = m[z], J = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        B.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (B.type === Fe || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !vs(B, M) || // - In the case of a component, it could contain anything.
        B.shapeFlag & 198) ? w(B.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          v
        )
      );
      G(
        B,
        M,
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
    const M = m.el = p ? p.el : a(""), J = m.anchor = p ? p.anchor : a("");
    let { patchFlag: q, dynamicChildren: Z, slotScopeIds: te } = m;
    te && (z = z ? z.concat(te) : te), p == null ? (s(M, v, N), s(J, v, N), xe(
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
    (m.key != null || R && m === R.subTree) && Ql(
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
    const z = p.component = oh(
      p,
      N,
      R
    );
    if ($l(p) && (z.ctx.renderer = W), lh(z, !1, U), z.asyncDep) {
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
    if (Zf(p, m, v))
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
          const f = ec(p);
          if (f) {
            q && (q.el = me.el, de(p, q, U)), f.asyncDep.then(() => {
              p.isUnmounted || z();
            });
            return;
          }
        }
        let Ae = q, Ne;
        Un(p, !1), q ? (q.el = me.el, de(p, q, U)) : q = me, Z && mi(Z), (Ne = q.props && q.props.onVnodeBeforeUpdate) && tn(Ne, re, q, me), Un(p, !0);
        const je = _a(p), ft = p.subTree;
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
        ), q.el = je.el, Ae === null && Jf(p, je.el), te && Bt(te, R), (Ne = q.props && q.props.onVnodeUpdated) && Bt(
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
          const f = p.subTree = _a(p);
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
    const B = p.effect = new ml(z);
    p.scope.off();
    const M = p.update = B.run.bind(B), J = p.job = B.runIfDirty.bind(B);
    J.i = p, J.id = p.uid, B.scheduler = () => go(J), Un(p, !0), M();
  }, de = (p, m, v) => {
    m.component = p;
    const N = p.vnode.props;
    p.vnode = m, p.next = null, Mf(p, m.props, N, v), $f(p, m.children, v), bn(), ua(p), wn();
  }, ae = (p, m, v, N, R, I, U, z, B = !1) => {
    const M = p && p.children, J = p ? p.shapeFlag : 0, q = m.children, { patchFlag: Z, shapeFlag: te } = m;
    if (Z > 0) {
      if (Z & 128) {
        tt(
          M,
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
          M,
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
    te & 8 ? (J & 16 && ot(M, R, I), q !== M && c(v, q)) : J & 16 ? te & 16 ? tt(
      M,
      q,
      v,
      N,
      R,
      I,
      U,
      z,
      B
    ) : ot(M, R, I, !0) : (J & 8 && c(v, ""), te & 16 && xe(
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
    const M = p.length, J = m.length, q = Math.min(M, J);
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
    M > J ? ot(
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
    let M = 0;
    const J = m.length;
    let q = p.length - 1, Z = J - 1;
    for (; M <= q && M <= Z; ) {
      const te = p[M], re = m[M] = B ? Rn(m[M]) : rn(m[M]);
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
      M++;
    }
    for (; M <= q && M <= Z; ) {
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
    if (M > q) {
      if (M <= Z) {
        const te = Z + 1, re = te < J ? m[te].el : N;
        for (; M <= Z; )
          G(
            null,
            m[M] = B ? Rn(m[M]) : rn(m[M]),
            v,
            re,
            R,
            I,
            U,
            z,
            B
          ), M++;
      }
    } else if (M > Z)
      for (; M <= q; )
        Le(p[M], R, I, !0), M++;
    else {
      const te = M, re = M, me = /* @__PURE__ */ new Map();
      for (M = re; M <= Z; M++) {
        const S = m[M] = B ? Rn(m[M]) : rn(m[M]);
        S.key != null && me.set(S.key, M);
      }
      let Ae, Ne = 0;
      const je = Z - re + 1;
      let ft = !1, f = 0;
      const y = new Array(je);
      for (M = 0; M < je; M++) y[M] = 0;
      for (M = te; M <= q; M++) {
        const S = p[M];
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
        $ === void 0 ? Le(S, R, I, !0) : (y[$ - re] = M + 1, $ >= f ? f = $ : ft = !0, G(
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
      const C = ft ? qf(y) : ns;
      for (Ae = C.length - 1, M = je - 1; M >= 0; M--) {
        const S = re + M, $ = m[S], Y = m[S + 1], ne = S + 1 < J ? (
          // #13559, fallback to el placeholder for unresolved async component
          Y.el || Y.placeholder
        ) : N;
        y[M] === 0 ? G(
          null,
          $,
          v,
          ne,
          R,
          I,
          U,
          z,
          B
        ) : ft && (Ae < 0 || M !== C[Ae] ? oe($, v, ne, 2) : Ae--);
      }
    }
  }, oe = (p, m, v, N, R = null) => {
    const { el: I, type: U, transition: z, children: B, shapeFlag: M } = p;
    if (M & 6) {
      oe(p.component.subTree, m, v, N);
      return;
    }
    if (M & 128) {
      p.suspense.move(m, v, N);
      return;
    }
    if (M & 64) {
      U.move(p, m, v, W);
      return;
    }
    if (U === Fe) {
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
    if (N !== 2 && M & 1 && z)
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
      dynamicChildren: M,
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
      ) : M && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !M.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (I !== Fe || q > 0 && q & 64) ? ot(
        M,
        m,
        v,
        !1,
        !0
      ) : (I === Fe && q & 384 || !R && J & 16) && ot(B, m, v), N && Oe(p);
    }
    (me && (Ae = U && U.onVnodeUnmounted) || re) && Bt(() => {
      Ae && tn(Ae, m, p), re && $n(p, null, m, "unmounted");
    }, v);
  }, Oe = (p) => {
    const { type: m, el: v, anchor: N, transition: R } = p;
    if (m === Fe) {
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
      a: M,
      parent: J,
      slots: { __: q }
    } = p;
    ma(B), ma(M), N && mi(N), J && pe(q) && q.forEach((Z) => {
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
    const m = k(p.anchor || p.el), v = m && m[hf];
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
    ), m._vnode = p, Lt || (Lt = !0, ua(), Pl(), Lt = !1);
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
    createApp: Of(_t)
  };
}
function br({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function Un({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Hf(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Ql(e, t, n = !1) {
  const s = e.children, i = t.children;
  if (pe(s) && pe(i))
    for (let r = 0; r < s.length; r++) {
      const o = s[r];
      let a = i[r];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = i[r] = Rn(i[r]), a.el = o.el), !n && a.patchFlag !== -2 && Ql(o, a)), a.type === Zi && (a.el = o.el), a.type === Pn && !a.el && (a.el = o.el);
    }
}
function qf(e) {
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
function ec(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : ec(t);
}
function ma(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
const Wf = Symbol.for("v-scx"), jf = () => _i(Wf);
function Wt(e, t, n) {
  return tc(e, t, n);
}
function tc(e, t, n = Qe) {
  const { immediate: s, deep: i, flush: r, once: o } = n, a = bt({}, n), l = t && s || !t && r !== "post";
  let d;
  if (Vs) {
    if (r === "sync") {
      const D = jf();
      d = D.__watcherHandles || (D.__watcherHandles = []);
    } else if (!l) {
      const D = () => {
      };
      return D.stop = on, D.resume = on, D.pause = on, D;
    }
  }
  const c = Et;
  a.call = (D, F, G) => cn(D, c, F, G);
  let w = !1;
  r === "post" ? a.scheduler = (D) => {
    Bt(D, c && c.suspense);
  } : r !== "sync" && (w = !0, a.scheduler = (D, F) => {
    F ? D() : go(D);
  }), a.augmentJob = (D) => {
    t && (D.flags |= 4), w && (D.flags |= 2, c && (D.id = c.uid, D.i = c));
  };
  const k = af(e, t, a);
  return Vs && (d ? d.push(k) : l && k()), k;
}
function Vf(e, t, n) {
  const s = this.proxy, i = ct(e) ? e.includes(".") ? nc(s, e) : () => s[e] : e.bind(s, s);
  let r;
  _e(t) ? r = t : (r = t.handler, n = t);
  const o = Xs(this), a = tc(i, r.bind(s), n);
  return o(), a;
}
function nc(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let i = 0; i < n.length && s; i++)
      s = s[n[i]];
    return s;
  };
}
const Kf = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${On(t)}Modifiers`] || e[`${Fn(t)}Modifiers`];
function Gf(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || Qe;
  let i = n;
  const r = t.startsWith("update:"), o = r && Kf(s, t.slice(7));
  o && (o.trim && (i = n.map((c) => ct(c) ? c.trim() : c)), o.number && (i = n.map(Mr)));
  let a, l = s[a = pr(t)] || // also try camelCase event handler (#2249)
  s[a = pr(On(t))];
  !l && r && (l = s[a = pr(Fn(t))]), l && cn(
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
function sc(e, t, n = !1) {
  const s = t.emitsCache, i = s.get(e);
  if (i !== void 0)
    return i;
  const r = e.emits;
  let o = {}, a = !1;
  if (!_e(e)) {
    const l = (d) => {
      const c = sc(d, t, !0);
      c && (a = !0, bt(o, c));
    };
    !n && t.mixins.length && t.mixins.forEach(l), e.extends && l(e.extends), e.mixins && e.mixins.forEach(l);
  }
  return !r && !a ? (it(e) && s.set(e, null), null) : (pe(r) ? r.forEach((l) => o[l] = null) : bt(o, r), it(e) && s.set(e, o), o);
}
function Xi(e, t) {
  return !e || !zi(t) ? !1 : (t = t.slice(2).replace(/Once$/, ""), qe(e, t[0].toLowerCase() + t.slice(1)) || qe(e, Fn(t)) || qe(e, t));
}
function _a(e) {
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
    ctx: F,
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
          F
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
      ), ue = t.props ? a : Yf(a);
    }
  } catch (T) {
    Us.length = 0, Ki(T, e, 1), ce = an(Pn);
  }
  let ge = ce;
  if (ue && G !== !1) {
    const T = Object.keys(ue), { shapeFlag: L } = ge;
    T.length && L & 7 && (r && T.some(io) && (ue = Xf(
      ue,
      r
    )), ge = cs(ge, ue, !1, !0));
  }
  return n.dirs && (ge = cs(ge, null, !1, !0), ge.dirs = ge.dirs ? ge.dirs.concat(n.dirs) : n.dirs), n.transition && mo(ge, n.transition), ce = ge, Ni(H), ce;
}
const Yf = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || zi(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, Xf = (e, t) => {
  const n = {};
  for (const s in e)
    (!io(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function Zf(e, t, n) {
  const { props: s, children: i, component: r } = e, { props: o, children: a, patchFlag: l } = t, d = r.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && l >= 0) {
    if (l & 1024)
      return !0;
    if (l & 16)
      return s ? ya(s, o, d) : !!o;
    if (l & 8) {
      const c = t.dynamicProps;
      for (let w = 0; w < c.length; w++) {
        const k = c[w];
        if (o[k] !== s[k] && !Xi(d, k))
          return !0;
      }
    }
  } else
    return (i || a) && (!a || !a.$stable) ? !0 : s === o ? !1 : s ? o ? ya(s, o, d) : !0 : !!o;
  return !1;
}
function ya(e, t, n) {
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
function Jf({ vnode: e, parent: t }, n) {
  for (; t; ) {
    const s = t.subTree;
    if (s.suspense && s.suspense.activeBranch === e && (s.el = e.el), s === e)
      (e = t.vnode).el = n, t = t.parent;
    else
      break;
  }
}
const ic = (e) => e.__isSuspense;
function Qf(e, t) {
  t && t.pendingBranch ? pe(e) ? t.effects.push(...e) : t.effects.push(e) : uf(e);
}
const Fe = Symbol.for("v-fgt"), Zi = Symbol.for("v-txt"), Pn = Symbol.for("v-cmt"), yi = Symbol.for("v-stc"), Us = [];
let $t = null;
function x(e = !1) {
  Us.push($t = e ? null : []);
}
function eh() {
  Us.pop(), $t = Us[Us.length - 1] || null;
}
let js = 1;
function va(e, t = !1) {
  js += e, e < 0 && $t && t && ($t.hasOnce = !0);
}
function rc(e) {
  return e.dynamicChildren = js > 0 ? $t || ns : null, eh(), js > 0 && $t && $t.push(e), e;
}
function A(e, t, n, s, i, r) {
  return rc(
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
function oc(e, t, n, s, i) {
  return rc(
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
function ac(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function vs(e, t) {
  return e.type === t.type && e.key === t.key;
}
const lc = ({ key: e }) => e ?? null, vi = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? ct(e) || vt(e) || _e(e) ? { i: jt, r: e, k: t, f: !!n } : e : null);
function b(e, t = null, n = null, s = 0, i = null, r = e === Fe ? 0 : 1, o = !1, a = !1) {
  const l = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && lc(t),
    ref: t && vi(t),
    scopeId: Fl,
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
  return a ? (vo(l, n), r & 128 && e.normalize(l)) : n && (l.shapeFlag |= ct(n) ? 8 : 16), js > 0 && // avoid a block node from tracking itself
  !o && // has current parent block
  $t && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (l.patchFlag > 0 || r & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  l.patchFlag !== 32 && $t.push(l), l;
}
const an = th;
function th(e, t = null, n = null, s = 0, i = null, r = !1) {
  if ((!e || e === Af) && (e = Pn), ac(e)) {
    const a = cs(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && vo(a, n), js > 0 && !r && $t && (a.shapeFlag & 6 ? $t[$t.indexOf(e)] = a : $t.push(a)), a.patchFlag = -2, a;
  }
  if (hh(e) && (e = e.__vccOpts), t) {
    t = nh(t);
    let { class: a, style: l } = t;
    a && !ct(a) && (t.class = ze(a)), it(l) && (po(l) && !pe(l) && (l = bt({}, l)), t.style = ke(l));
  }
  const o = ct(e) ? 1 : ic(e) ? 128 : df(e) ? 64 : it(e) ? 4 : _e(e) ? 2 : 0;
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
function nh(e) {
  return e ? po(e) || Kl(e) ? bt({}, e) : e : null;
}
function cs(e, t, n = !1, s = !1) {
  const { props: i, ref: r, patchFlag: o, children: a, transition: l } = e, d = t ? sh(i || {}, t) : i, c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: d,
    key: d && lc(d),
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
    patchFlag: t && e.type !== Fe ? o === -1 ? 16 : o | 16 : o,
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
  return l && s && mo(
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
  return t ? (x(), oc(Pn, null, e)) : an(Pn, null, e);
}
function rn(e) {
  return e == null || typeof e == "boolean" ? an(Pn) : pe(e) ? an(
    Fe,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : ac(e) ? Rn(e) : an(Zi, null, String(e));
}
function Rn(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : cs(e);
}
function vo(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (pe(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const i = t.default;
      i && (i._c && (i._d = !1), vo(e, i()), i._c && (i._d = !0));
      return;
    } else {
      n = 32;
      const i = t._;
      !i && !Kl(t) ? t._ctx = jt : i === 3 && jt && (jt.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else _e(t) ? (t = { default: t, _ctx: jt }, n = 32) : (t = String(t), s & 64 ? (n = 16, t = [dn(t)]) : n = 8);
  e.children = t, e.shapeFlag |= n;
}
function sh(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const i in s)
      if (i === "class")
        t.class !== s.class && (t.class = ze([t.class, s.class]));
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
const ih = Wl();
let rh = 0;
function oh(e, t, n) {
  const s = e.type, i = (t ? t.appContext : e.appContext) || ih, r = {
    uid: rh++,
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
    scope: new Ou(
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
    propsOptions: Yl(s, i),
    emitsOptions: sc(s, i),
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
  return r.ctx = { _: r }, r.root = t ? t.root : r, r.emit = Gf.bind(null, r), e.ce && e.ce(r), r;
}
let Et = null;
const ah = () => Et || jt;
let Mi, Wr;
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
  ), Wr = t(
    "__VUE_SSR_SETTERS__",
    (n) => Vs = n
  );
}
const Xs = (e) => {
  const t = Et;
  return Mi(e), e.scope.on(), () => {
    e.scope.off(), Mi(t);
  };
}, ba = () => {
  Et && Et.scope.off(), Mi(null);
};
function cc(e) {
  return e.vnode.shapeFlag & 4;
}
let Vs = !1;
function lh(e, t = !1, n = !1) {
  t && Wr(t);
  const { props: s, children: i } = e.vnode, r = cc(e);
  Pf(e, s, r, t), Bf(e, i, n || t);
  const o = r ? ch(e, t) : void 0;
  return t && Wr(!1), o;
}
function ch(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Tf);
  const { setup: s } = n;
  if (s) {
    bn();
    const i = e.setupContext = s.length > 1 ? fh(e) : null, r = Xs(e), o = Gs(
      s,
      e,
      0,
      [
        e.props,
        i
      ]
    ), a = cl(o);
    if (wn(), r(), (a || e.sp) && !Bs(e) && Bl(e), a) {
      if (o.then(ba, ba), t)
        return o.then((l) => {
          wa(e, l);
        }).catch((l) => {
          Ki(l, e, 0);
        });
      e.asyncDep = o;
    } else
      wa(e, o);
  } else
    uc(e);
}
function wa(e, t, n) {
  _e(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : it(t) && (e.setupState = Ll(t)), uc(e);
}
function uc(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || on);
  {
    const i = Xs(e);
    bn();
    try {
      Sf(e);
    } finally {
      wn(), i();
    }
  }
}
const uh = {
  get(e, t) {
    return yt(e, "get", ""), e[t];
  }
};
function fh(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, uh),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Ji(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Ll(Qu(e.exposed)), {
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
function hh(e) {
  return _e(e) && "__vccOpts" in e;
}
const le = (e, t) => rf(e, t, Vs), dh = "3.5.18";
/**
* @vue/runtime-dom v3.5.18
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let jr;
const ka = typeof window < "u" && window.trustedTypes;
if (ka)
  try {
    jr = /* @__PURE__ */ ka.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const fc = jr ? (e) => jr.createHTML(e) : (e) => e, ph = "http://www.w3.org/2000/svg", gh = "http://www.w3.org/1998/Math/MathML", gn = typeof document < "u" ? document : null, xa = gn && /* @__PURE__ */ gn.createElement("template"), mh = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const i = t === "svg" ? gn.createElementNS(ph, e) : t === "mathml" ? gn.createElementNS(gh, e) : n ? gn.createElement(e, { is: n }) : gn.createElement(e);
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
      xa.innerHTML = fc(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const a = xa.content;
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
}, _h = Symbol("_vtc");
function yh(e, t, n) {
  const s = e[_h];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const Fi = Symbol("_vod"), hc = Symbol("_vsh"), vh = {
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
  e.style.display = t ? e[Fi] : "none", e[hc] = !t;
}
const bh = Symbol(""), wh = /(^|;)\s*display\s*:/;
function kh(e, t, n) {
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
      const o = s[bh];
      o && (n += ";" + o), s.cssText = n, r = wh.test(n);
    }
  } else t && e.removeAttribute("style");
  Fi in e && (e[Fi] = r ? s.display : "", e[hc] && (s.display = "none"));
}
const Aa = /\s*!important$/;
function bi(e, t, n) {
  if (pe(n))
    n.forEach((s) => bi(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = xh(e, t);
    Aa.test(n) ? e.setProperty(
      Fn(s),
      n.replace(Aa, ""),
      "important"
    ) : e[s] = n;
  }
}
const Ta = ["Webkit", "Moz", "ms"], wr = {};
function xh(e, t) {
  const n = wr[t];
  if (n)
    return n;
  let s = On(t);
  if (s !== "filter" && s in e)
    return wr[t] = s;
  s = hl(s);
  for (let i = 0; i < Ta.length; i++) {
    const r = Ta[i] + s;
    if (r in e)
      return wr[t] = r;
  }
  return t;
}
const Sa = "http://www.w3.org/1999/xlink";
function Ea(e, t, n, s, i, r = Lu(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(Sa, t.slice(6, t.length)) : e.setAttributeNS(Sa, t, n) : n == null || r && !dl(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    r ? "" : Mn(n) ? String(n) : n
  );
}
function Ca(e, t, n, s, i) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? fc(n) : n);
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
    a === "boolean" ? n = dl(n) : n == null && a === "string" ? (n = "", o = !0) : a === "number" && (n = 0, o = !0);
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
function Ah(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const Ra = Symbol("_vei");
function Th(e, t, n, s, i = null) {
  const r = e[Ra] || (e[Ra] = {}), o = r[t];
  if (s && o)
    o.value = s;
  else {
    const [a, l] = Sh(t);
    if (s) {
      const d = r[t] = Rh(
        s,
        i
      );
      ts(e, a, d, l);
    } else o && (Ah(e, a, o, l), r[t] = void 0);
  }
}
const Ia = /(?:Once|Passive|Capture)$/;
function Sh(e) {
  let t;
  if (Ia.test(e)) {
    t = {};
    let s;
    for (; s = e.match(Ia); )
      e = e.slice(0, e.length - s[0].length), t[s[0].toLowerCase()] = !0;
  }
  return [e[2] === ":" ? e.slice(3) : Fn(e.slice(2)), t];
}
let kr = 0;
const Eh = /* @__PURE__ */ Promise.resolve(), Ch = () => kr || (Eh.then(() => kr = 0), kr = Date.now());
function Rh(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    cn(
      Ih(s, n.value),
      t,
      5,
      [s]
    );
  };
  return n.value = e, n.attached = Ch(), n;
}
function Ih(e, t) {
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
const La = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, Lh = (e, t, n, s, i, r) => {
  const o = i === "svg";
  t === "class" ? yh(e, s, o) : t === "style" ? kh(e, n, s) : zi(t) ? io(t) || Th(e, t, n, s, r) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Oh(e, t, s, o)) ? (Ca(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Ea(e, t, s, o, r, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && (/[A-Z]/.test(t) || !ct(s)) ? Ca(e, On(t), s, r, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), Ea(e, t, s, o));
};
function Oh(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && La(t) && _e(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const i = e.tagName;
    if (i === "IMG" || i === "VIDEO" || i === "CANVAS" || i === "SOURCE")
      return !1;
  }
  return La(t) && ct(n) ? !1 : t in e;
}
const Oa = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return pe(t) ? (n) => mi(t, n) : t;
};
function Nh(e) {
  e.target.composing = !0;
}
function Na(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const xr = Symbol("_assign"), Hn = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, i) {
    e[xr] = Oa(i);
    const r = s || i.props && i.props.type === "number";
    ts(e, t ? "change" : "input", (o) => {
      if (o.target.composing) return;
      let a = e.value;
      n && (a = a.trim()), r && (a = Mr(a)), e[xr](a);
    }), n && ts(e, "change", () => {
      e.value = e.value.trim();
    }), t || (ts(e, "compositionstart", Nh), ts(e, "compositionend", Na), ts(e, "change", Na));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: i, number: r } }, o) {
    if (e[xr] = Oa(o), e.composing) return;
    const a = (r || e.type === "number") && !/^0\d/.test(e.value) ? Mr(e.value) : e.value, l = t ?? "";
    a !== l && (document.activeElement === e && e.type !== "range" && (s && t === n || i && e.value.trim() === l) || (e.value = l));
  }
}, Ph = ["ctrl", "shift", "alt", "meta"], Mh = {
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
  exact: (e, t) => Ph.some((n) => e[`${n}Key`] && !t.includes(n))
}, Wn = (e, t) => {
  const n = e._withMods || (e._withMods = {}), s = t.join(".");
  return n[s] || (n[s] = (i, ...r) => {
    for (let o = 0; o < t.length; o++) {
      const a = Mh[t[o]];
      if (a && a(i, t)) return;
    }
    return e(i, ...r);
  });
}, Fh = {
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
      (o) => o === r || Fh[o] === r
    ))
      return e(i);
  });
}, Dh = /* @__PURE__ */ bt({ patchProp: Lh }, mh);
let Pa;
function Bh() {
  return Pa || (Pa = Uf(Dh));
}
const $h = (...e) => {
  const t = Bh().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const i = zh(s);
    if (!i) return;
    const r = t._component;
    !_e(r) && !r.render && !r.template && (r.template = i.innerHTML), i.nodeType === 1 && (i.textContent = "");
    const o = n(i, !1, Uh(i));
    return i instanceof Element && (i.removeAttribute("v-cloak"), i.setAttribute("data-v-app", "")), o;
  }, t;
};
function Uh(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function zh(e) {
  return ct(e) ? document.querySelector(e) : e;
}
const ls = (e) => {
  const t = e.replace("#", ""), n = parseInt(t.substr(0, 2), 16), s = parseInt(t.substr(2, 2), 16), i = parseInt(t.substr(4, 2), 16);
  return (n * 299 + s * 587 + i * 114) / 1e3 < 128;
}, Hh = (e, t) => {
  const n = e.replace("#", ""), s = parseInt(n.substr(0, 2), 16), i = parseInt(n.substr(2, 2), 16), r = parseInt(n.substr(4, 2), 16), o = ls(e), a = o ? Math.min(255, s + t) : Math.max(0, s - t), l = o ? Math.min(255, i + t) : Math.max(0, i - t), d = o ? Math.min(255, r + t) : Math.max(0, r - t);
  return `#${a.toString(16).padStart(2, "0")}${l.toString(16).padStart(2, "0")}${d.toString(16).padStart(2, "0")}`;
}, ws = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e), qh = (e) => {
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
function bo() {
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
var Kn = bo();
function dc(e) {
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
}, Wh = /^(?:[ \t]*(?:\n|$))+/, jh = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Vh = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Zs = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Kh = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, wo = /(?:[*+-]|\d{1,9}[.)])/, pc = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, gc = We(pc).replace(/bull/g, wo).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), Gh = We(pc).replace(/bull/g, wo).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), ko = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Yh = /^[^\n]+/, xo = /(?!\s*\])(?:\\.|[^\[\]\\])+/, Xh = We(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", xo).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Zh = We(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, wo).getRegex(), Qi = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Ao = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Jh = We(
  "^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))",
  "i"
).replace("comment", Ao).replace("tag", Qi).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), mc = We(ko).replace("hr", Zs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Qi).getRegex(), Qh = We(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", mc).getRegex(), To = {
  blockquote: Qh,
  code: jh,
  def: Xh,
  fences: Vh,
  heading: Kh,
  hr: Zs,
  html: Jh,
  lheading: gc,
  list: Zh,
  newline: Wh,
  paragraph: mc,
  table: zs,
  text: Yh
}, Ma = We(
  "^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)"
).replace("hr", Zs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Qi).getRegex(), ed = {
  ...To,
  lheading: Gh,
  table: Ma,
  paragraph: We(ko).replace("hr", Zs).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Ma).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Qi).getRegex()
}, td = {
  ...To,
  html: We(
    `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`
  ).replace("comment", Ao).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: zs,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: We(ko).replace("hr", Zs).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", gc).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, nd = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, sd = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, _c = /^( {2,}|\\)\n(?!\s*$)/, id = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, er = /[\p{P}\p{S}]/u, So = /[\s\p{P}\p{S}]/u, yc = /[^\s\p{P}\p{S}]/u, rd = We(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, So).getRegex(), vc = /(?!~)[\p{P}\p{S}]/u, od = /(?!~)[\s\p{P}\p{S}]/u, ad = /(?:[^\s\p{P}\p{S}]|~)/u, ld = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, bc = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, cd = We(bc, "u").replace(/punct/g, er).getRegex(), ud = We(bc, "u").replace(/punct/g, vc).getRegex(), wc = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", fd = We(wc, "gu").replace(/notPunctSpace/g, yc).replace(/punctSpace/g, So).replace(/punct/g, er).getRegex(), hd = We(wc, "gu").replace(/notPunctSpace/g, ad).replace(/punctSpace/g, od).replace(/punct/g, vc).getRegex(), dd = We(
  "^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)",
  "gu"
).replace(/notPunctSpace/g, yc).replace(/punctSpace/g, So).replace(/punct/g, er).getRegex(), pd = We(/\\(punct)/, "gu").replace(/punct/g, er).getRegex(), gd = We(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), md = We(Ao).replace("(?:-->|$)", "-->").getRegex(), _d = We(
  "^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>"
).replace("comment", md).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Di = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, yd = We(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", Di).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), kc = We(/^!?\[(label)\]\[(ref)\]/).replace("label", Di).replace("ref", xo).getRegex(), xc = We(/^!?\[(ref)\](?:\[\])?/).replace("ref", xo).getRegex(), vd = We("reflink|nolink(?!\\()", "g").replace("reflink", kc).replace("nolink", xc).getRegex(), Eo = {
  _backpedal: zs,
  // only used for GFM url
  anyPunctuation: pd,
  autolink: gd,
  blockSkip: ld,
  br: _c,
  code: sd,
  del: zs,
  emStrongLDelim: cd,
  emStrongRDelimAst: fd,
  emStrongRDelimUnd: dd,
  escape: nd,
  link: yd,
  nolink: xc,
  punctuation: rd,
  reflink: kc,
  reflinkSearch: vd,
  tag: _d,
  text: id,
  url: zs
}, bd = {
  ...Eo,
  link: We(/^!?\[(label)\]\((.*?)\)/).replace("label", Di).getRegex(),
  reflink: We(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Di).getRegex()
}, Vr = {
  ...Eo,
  emStrongRDelimAst: hd,
  emStrongLDelim: ud,
  url: We(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, wd = {
  ...Vr,
  br: We(_c).replace("{2,}", "*").getRegex(),
  text: We(Vr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, fi = {
  normal: To,
  gfm: ed,
  pedantic: td
}, ks = {
  normal: Eo,
  gfm: Vr,
  breaks: wd,
  pedantic: bd
}, kd = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Fa = (e) => kd[e];
function nn(e, t) {
  if (t) {
    if (Ct.escapeTest.test(e))
      return e.replace(Ct.escapeReplace, Fa);
  } else if (Ct.escapeTestNoEncode.test(e))
    return e.replace(Ct.escapeReplaceNoEncode, Fa);
  return e;
}
function Da(e) {
  try {
    e = encodeURI(e).replace(Ct.percentDecode, "%");
  } catch {
    return null;
  }
  return e;
}
function Ba(e, t) {
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
function xd(e, t) {
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
function $a(e, t, n, s, i) {
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
function Ad(e, t, n) {
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
      const n = t[0], s = Ad(n, t[3] || "", this.rules);
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
          const D = k, F = D.raw + `
` + n.join(`
`), G = this.blockquote(F);
          r[r.length - 1] = G, s = s.substring(0, s.length - D.raw.length) + G.raw, i = i.substring(0, i.length - D.text.length) + G.text;
          break;
        } else if ((k == null ? void 0 : k.type) === "list") {
          const D = k, F = D.raw + `
` + n.join(`
`), G = this.list(F);
          r[r.length - 1] = G, s = s.substring(0, s.length - k.raw.length) + G.raw, i = i.substring(0, i.length - D.raw.length) + G.raw, n = F.substring(r.at(-1).raw.length).split(`
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
`, 1)[0], D = !w.trim(), F = 0;
        if (this.options.pedantic ? (F = 2, c = w.trimStart()) : D ? F = t[1].length + 1 : (F = t[2].search(this.rules.other.nonSpaceChar), F = F > 4 ? 1 : F, c = w.slice(F), F += t[1].length), D && this.rules.other.blankLine.test(k) && (d += k + `
`, e = e.substring(k.length + 1), l = !0), !l) {
          const ce = this.rules.other.nextBulletRegex(F), ue = this.rules.other.hrRegex(F), ge = this.rules.other.fencesBeginRegex(F), T = this.rules.other.headingBeginRegex(F), L = this.rules.other.htmlBeginRegex(F);
          for (; e; ) {
            const V = e.split(`
`, 1)[0];
            let K;
            if (k = V, this.options.pedantic ? (k = k.replace(this.rules.other.listReplaceNesting, "  "), K = k) : K = k.replace(this.rules.other.tabCharGlobal, "    "), ge.test(k) || T.test(k) || L.test(k) || ce.test(k) || ue.test(k))
              break;
            if (K.search(this.rules.other.nonSpaceChar) >= F || !k.trim())
              c += `
` + K.slice(F);
            else {
              if (D || w.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || ge.test(w) || T.test(w) || ue.test(w))
                break;
              c += `
` + k;
            }
            !D && !k.trim() && (D = !0), d += V + `
`, e = e.substring(V.length + 1), w = K.slice(F);
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
    const n = Ba(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = (o = t[3]) != null && o.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
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
        r.rows.push(Ba(a, r.header.length).map((l, d) => ({
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
        const r = xd(t[2], "()");
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
      return s = s.trim(), this.rules.other.startAngleBracket.test(s) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), $a(t, {
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
      return $a(n, i, n[0], this.lexer, this.rules);
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
          const F = k.slice(1, -1);
          return {
            type: "em",
            raw: k,
            text: F,
            tokens: this.lexer.inlineTokens(F)
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
}, yn = class Kr {
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
    return new Kr(n).lex(t);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(t, n) {
    return new Kr(n).inlineTokens(t);
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
        let F;
        this.options.extensions.startInline.forEach((G) => {
          F = G.call({ lexer: this }, D), typeof F == "number" && F >= 0 && (k = Math.min(k, F));
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
    const s = this.parser.parseInline(n), i = Da(e);
    if (i === null)
      return s;
    e = i;
    let r = '<a href="' + e + '"';
    return t && (r += ' title="' + nn(t) + '"'), r += ">" + s + "</a>", r;
  }
  image({ href: e, title: t, text: n, tokens: s }) {
    s && (n = this.parser.parseInline(s, this.parser.textRenderer));
    const i = Da(e);
    if (i === null)
      return nn(n);
    e = i;
    let r = `<img src="${e}" alt="${n}"`;
    return t && (r += ` title="${nn(t)}"`), r += ">", r;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : nn(e.text);
  }
}, Co = class {
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
}, vn = class Gr {
  constructor(t) {
    Je(this, "options");
    Je(this, "renderer");
    Je(this, "textRenderer");
    this.options = t || Kn, this.options.renderer = this.options.renderer || new $i(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new Co();
  }
  /**
   * Static Parse Method
   */
  static parse(t, n) {
    return new Gr(n).parse(t);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(t, n) {
    return new Gr(n).parseInline(t);
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
}, Nr, ki = (Nr = class {
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
}, Je(Nr, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
])), Nr), Td = class {
  constructor(...e) {
    Je(this, "defaults", bo());
    Je(this, "options", this.setOptions);
    Je(this, "parse", this.parseMarkdown(!0));
    Je(this, "parseInline", this.parseMarkdown(!1));
    Je(this, "Parser", vn);
    Je(this, "Renderer", $i);
    Je(this, "TextRenderer", Co);
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
}, Vn = new Td();
function De(e, t) {
  return Vn.parse(e, t);
}
De.options = De.setOptions = function(e) {
  return Vn.setOptions(e), De.defaults = Vn.defaults, dc(De.defaults), De;
};
De.getDefaults = bo;
De.defaults = Kn;
De.use = function(...e) {
  return Vn.use(...e), De.defaults = Vn.defaults, dc(De.defaults), De;
};
De.walkTokens = function(e, t) {
  return Vn.walkTokens(e, t);
};
De.parseInline = Vn.parseInline;
De.Parser = vn;
De.parser = vn.parse;
De.Renderer = $i;
De.TextRenderer = Co;
De.Lexer = yn;
De.lexer = yn.lex;
De.Tokenizer = Bi;
De.Hooks = ki;
De.parse = De;
De.options;
De.setOptions;
De.use;
De.walkTokens;
De.parseInline;
vn.parse;
yn.lex;
/*! @license DOMPurify 3.2.6 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.2.6/LICENSE */
const {
  entries: Ac,
  setPrototypeOf: Ua,
  isFrozen: Sd,
  getPrototypeOf: Ed,
  getOwnPropertyDescriptor: Cd
} = Object;
let {
  freeze: Rt,
  seal: Kt,
  create: Tc
} = Object, {
  apply: Yr,
  construct: Xr
} = typeof Reflect < "u" && Reflect;
Rt || (Rt = function(t) {
  return t;
});
Kt || (Kt = function(t) {
  return t;
});
Yr || (Yr = function(t, n, s) {
  return t.apply(n, s);
});
Xr || (Xr = function(t, n) {
  return new t(...n);
});
const hi = It(Array.prototype.forEach), Rd = It(Array.prototype.lastIndexOf), za = It(Array.prototype.pop), As = It(Array.prototype.push), Id = It(Array.prototype.splice), xi = It(String.prototype.toLowerCase), Ar = It(String.prototype.toString), Ha = It(String.prototype.match), Ts = It(String.prototype.replace), Ld = It(String.prototype.indexOf), Od = It(String.prototype.trim), Zt = It(Object.prototype.hasOwnProperty), At = It(RegExp.prototype.test), Ss = Nd(TypeError);
function It(e) {
  return function(t) {
    t instanceof RegExp && (t.lastIndex = 0);
    for (var n = arguments.length, s = new Array(n > 1 ? n - 1 : 0), i = 1; i < n; i++)
      s[i - 1] = arguments[i];
    return Yr(e, t, s);
  };
}
function Nd(e) {
  return function() {
    for (var t = arguments.length, n = new Array(t), s = 0; s < t; s++)
      n[s] = arguments[s];
    return Xr(e, n);
  };
}
function Ee(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : xi;
  Ua && Ua(e, null);
  let s = t.length;
  for (; s--; ) {
    let i = t[s];
    if (typeof i == "string") {
      const r = n(i);
      r !== i && (Sd(t) || (t[s] = r), i = r);
    }
    e[i] = !0;
  }
  return e;
}
function Pd(e) {
  for (let t = 0; t < e.length; t++)
    Zt(e, t) || (e[t] = null);
  return e;
}
function pn(e) {
  const t = Tc(null);
  for (const [n, s] of Ac(e))
    Zt(e, n) && (Array.isArray(s) ? t[n] = Pd(s) : s && typeof s == "object" && s.constructor === Object ? t[n] = pn(s) : t[n] = s);
  return t;
}
function Es(e, t) {
  for (; e !== null; ) {
    const s = Cd(e, t);
    if (s) {
      if (s.get)
        return It(s.get);
      if (typeof s.value == "function")
        return It(s.value);
    }
    e = Ed(e);
  }
  function n() {
    return null;
  }
  return n;
}
const qa = Rt(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "section", "select", "shadow", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]), Tr = Rt(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]), Sr = Rt(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]), Md = Rt(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]), Er = Rt(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]), Fd = Rt(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]), Wa = Rt(["#text"]), ja = Rt(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns", "slot"]), Cr = Rt(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]), Va = Rt(["accent", "accentunder", "align", "bevelled", "close", "columnsalign", "columnlines", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lspace", "lquote", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]), di = Rt(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]), Dd = Kt(/\{\{[\w\W]*|[\w\W]*\}\}/gm), Bd = Kt(/<%[\w\W]*|[\w\W]*%>/gm), $d = Kt(/\$\{[\w\W]*/gm), Ud = Kt(/^data-[\-\w.\u00B7-\uFFFF]+$/), zd = Kt(/^aria-[\-\w]+$/), Sc = Kt(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
), Hd = Kt(/^(?:\w+script|data):/i), qd = Kt(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
), Ec = Kt(/^html$/i), Wd = Kt(/^[a-z][.\w]*(-[.\w]+)+$/i);
var Ka = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ARIA_ATTR: zd,
  ATTR_WHITESPACE: qd,
  CUSTOM_ELEMENT: Wd,
  DATA_ATTR: Ud,
  DOCTYPE_NAME: Ec,
  ERB_EXPR: Bd,
  IS_ALLOWED_URI: Sc,
  IS_SCRIPT_OR_DATA: Hd,
  MUSTACHE_EXPR: Dd,
  TMPLIT_EXPR: $d
});
const Cs = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9
}, jd = function() {
  return typeof window > "u" ? null : window;
}, Vd = function(t, n) {
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
}, Ga = function() {
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
function Cc() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : jd();
  const t = (j) => Cc(j);
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
  } = e, F = l.prototype, G = Es(F, "cloneNode"), H = Es(F, "remove"), ce = Es(F, "nextSibling"), ue = Es(F, "childNodes"), ge = Es(F, "parentNode");
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
  let Ce = Ga();
  t.isSupported = typeof Ac == "function" && typeof ge == "function" && V && V.createHTMLDocument !== void 0;
  const {
    MUSTACHE_EXPR: ye,
    ERB_EXPR: Ye,
    TMPLIT_EXPR: et,
    DATA_ATTR: rt,
    ARIA_ATTR: fe,
    IS_SCRIPT_OR_DATA: de,
    ATTR_WHITESPACE: ae,
    CUSTOM_ELEMENT: Te
  } = Ka;
  let {
    IS_ALLOWED_URI: tt
  } = Ka, oe = null;
  const Le = Ee({}, [...qa, ...Tr, ...Sr, ...Er, ...Wa]);
  let Oe = null;
  const pt = Ee({}, [...ja, ...Cr, ...Va, ...di]);
  let Re = Object.seal(Tc(null, {
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
  })), ot = null, ut = null, Lt = !0, _t = !0, W = !1, st = !0, p = !1, m = !0, v = !1, N = !1, R = !1, I = !1, U = !1, z = !1, B = !0, M = !1;
  const J = "user-content-";
  let q = !0, Z = !1, te = {}, re = null;
  const me = Ee({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let Ae = null;
  const Ne = Ee({}, ["audio", "video", "img", "source", "image", "track"]);
  let je = null;
  const ft = Ee({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]), f = "http://www.w3.org/1998/Math/MathML", y = "http://www.w3.org/2000/svg", C = "http://www.w3.org/1999/xhtml";
  let S = C, $ = !1, Y = null;
  const ne = Ee({}, [f, y, C], Ar);
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
      at.indexOf(_.PARSER_MEDIA_TYPE) === -1 ? wt : _.PARSER_MEDIA_TYPE, Ve = Me === "application/xhtml+xml" ? Ar : xi, oe = Zt(_, "ALLOWED_TAGS") ? Ee({}, _.ALLOWED_TAGS, Ve) : Le, Oe = Zt(_, "ALLOWED_ATTR") ? Ee({}, _.ALLOWED_ATTR, Ve) : pt, Y = Zt(_, "ALLOWED_NAMESPACES") ? Ee({}, _.ALLOWED_NAMESPACES, Ar) : ne, je = Zt(_, "ADD_URI_SAFE_ATTR") ? Ee(pn(ft), _.ADD_URI_SAFE_ATTR, Ve) : ft, Ae = Zt(_, "ADD_DATA_URI_TAGS") ? Ee(pn(Ne), _.ADD_DATA_URI_TAGS, Ve) : Ne, re = Zt(_, "FORBID_CONTENTS") ? Ee({}, _.FORBID_CONTENTS, Ve) : me, ot = Zt(_, "FORBID_TAGS") ? Ee({}, _.FORBID_TAGS, Ve) : pn({}), ut = Zt(_, "FORBID_ATTR") ? Ee({}, _.FORBID_ATTR, Ve) : pn({}), te = Zt(_, "USE_PROFILES") ? _.USE_PROFILES : !1, Lt = _.ALLOW_ARIA_ATTR !== !1, _t = _.ALLOW_DATA_ATTR !== !1, W = _.ALLOW_UNKNOWN_PROTOCOLS || !1, st = _.ALLOW_SELF_CLOSE_IN_ATTR !== !1, p = _.SAFE_FOR_TEMPLATES || !1, m = _.SAFE_FOR_XML !== !1, v = _.WHOLE_DOCUMENT || !1, I = _.RETURN_DOM || !1, U = _.RETURN_DOM_FRAGMENT || !1, z = _.RETURN_TRUSTED_TYPE || !1, R = _.FORCE_BODY || !1, B = _.SANITIZE_DOM !== !1, M = _.SANITIZE_NAMED_PROPS || !1, q = _.KEEP_CONTENT !== !1, Z = _.IN_PLACE || !1, tt = _.ALLOWED_URI_REGEXP || Sc, S = _.NAMESPACE || C, be = _.MATHML_TEXT_INTEGRATION_POINTS || be, Se = _.HTML_INTEGRATION_POINTS || Se, Re = _.CUSTOM_ELEMENT_HANDLING || {}, _.CUSTOM_ELEMENT_HANDLING && fs(_.CUSTOM_ELEMENT_HANDLING.tagNameCheck) && (Re.tagNameCheck = _.CUSTOM_ELEMENT_HANDLING.tagNameCheck), _.CUSTOM_ELEMENT_HANDLING && fs(_.CUSTOM_ELEMENT_HANDLING.attributeNameCheck) && (Re.attributeNameCheck = _.CUSTOM_ELEMENT_HANDLING.attributeNameCheck), _.CUSTOM_ELEMENT_HANDLING && typeof _.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements == "boolean" && (Re.allowCustomizedBuiltInElements = _.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements), p && (_t = !1), U && (I = !0), te && (oe = Ee({}, Wa), Oe = [], te.html === !0 && (Ee(oe, qa), Ee(Oe, ja)), te.svg === !0 && (Ee(oe, Tr), Ee(Oe, Cr), Ee(Oe, di)), te.svgFilters === !0 && (Ee(oe, Sr), Ee(Oe, Cr), Ee(Oe, di)), te.mathMl === !0 && (Ee(oe, Er), Ee(Oe, Va), Ee(Oe, di))), _.ADD_TAGS && (oe === Le && (oe = pn(oe)), Ee(oe, _.ADD_TAGS, Ve)), _.ADD_ATTR && (Oe === pt && (Oe = pn(Oe)), Ee(Oe, _.ADD_ATTR, Ve)), _.ADD_URI_SAFE_ATTR && Ee(je, _.ADD_URI_SAFE_ATTR, Ve), _.FORBID_CONTENTS && (re === me && (re = pn(re)), Ee(re, _.FORBID_CONTENTS, Ve)), q && (oe["#text"] = !0), v && Ee(oe, ["html", "head", "body"]), oe.table && (Ee(oe, ["tbody"]), delete ot.tbody), _.TRUSTED_TYPES_POLICY) {
        if (typeof _.TRUSTED_TYPES_POLICY.createHTML != "function")
          throw Ss('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
        if (typeof _.TRUSTED_TYPES_POLICY.createScriptURL != "function")
          throw Ss('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
        T = _.TRUSTED_TYPES_POLICY, L = T.createHTML("");
      } else
        T === void 0 && (T = Vd(D, i)), T !== null && typeof L == "string" && (L = T.createHTML(""));
      Rt && Rt(_), Pt = _;
    }
  }, Gn = Ee({}, [...Tr, ...Sr, ...Md]), en = Ee({}, [...Er, ...Fd]), Qs = function(_) {
    let P = ge(_);
    (!P || !P.tagName) && (P = {
      namespaceURI: S,
      tagName: "template"
    });
    const X = xi(_.tagName), Be = xi(P.tagName);
    return Y[_.namespaceURI] ? _.namespaceURI === y ? P.namespaceURI === C ? X === "svg" : P.namespaceURI === f ? X === "svg" && (Be === "annotation-xml" || be[Be]) : !!Gn[X] : _.namespaceURI === f ? P.namespaceURI === C ? X === "math" : P.namespaceURI === y ? X === "math" && Se[Be] : !!en[X] : _.namespaceURI === C ? P.namespaceURI === y && !Se[Be] || P.namespaceURI === f && !be[Be] ? !1 : !en[X] && (Xe[X] || !Gn[X]) : !!(Me === "application/xhtml+xml" && Y[_.namespaceURI]) : !1;
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
      const Ze = Ha(_, /^[\r\n\t ]+/);
      X = Ze && Ze[0];
    }
    Me === "application/xhtml+xml" && S === C && (_ = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + _ + "</body></html>");
    const Be = T ? T.createHTML(_) : _;
    if (S === C)
      try {
        P = new k().parseFromString(Be, Me);
      } catch {
      }
    if (!P || !P.documentElement) {
      P = V.createDocument(S, "template", null);
      try {
        P.documentElement.innerHTML = $ ? L : Be;
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
        const Be = ge(_) || _.parentNode, ht = ue(_) || _.childNodes;
        if (ht && Be) {
          const Ze = ht.length;
          for (let $e = Ze - 1; $e >= 0; --$e) {
            const xt = G(ht[$e], !0);
            xt.__removalCount = (_.__removalCount || 0) + 1, Be.insertBefore(xt, ce(_));
          }
        }
      }
      return kt(_), !0;
    }
    return _ instanceof l && !Qs(_) || (X === "noscript" || X === "noembed" || X === "noframes") && At(/<\/no(script|embed|frames)/i, _.innerHTML) ? (kt(_), !0) : (p && _.nodeType === Cs.text && (P = _.textContent, hi([ye, Ye, et], (Be) => {
      P = Ts(P, Be, " ");
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
            if (!((P === "src" || P === "xlink:href" || P === "href") && _ !== "script" && Ld(X, "data:") === 0 && Ae[_])) {
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
    return _ !== "annotation-xml" && Ha(_, Te);
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
    let Be = P.length;
    for (; Be--; ) {
      const ht = P[Be], {
        name: Ze,
        namespaceURI: $e,
        value: xt
      } = ht, Dt = Ve(Ze), ps = xt;
      let dt = Ze === "value" ? ps : Od(ps);
      if (X.attrName = Dt, X.attrValue = dt, X.keepAttr = !0, X.forceKeepAttr = void 0, Gt(Ce.uponSanitizeAttribute, _, X), dt = X.attrValue, M && (Dt === "id" || Dt === "name") && (fn(Ze, _), dt = J + dt), m && At(/((--!?|])>)|<\/(style|title)/i, dt)) {
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
      if (T && typeof D == "object" && typeof D.getAttributeType == "function" && !$e)
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
          $e ? _.setAttributeNS($e, Ze, dt) : _.setAttribute(Ze, dt), An(_) ? kt(_) : za(t.removed);
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
    let _ = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, P = null, X = null, Be = null, ht = null;
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
    for (; Be = Ze.nextNode(); )
      ds(Be), Ft(Be), Be.content instanceof r && Ut(Be.content);
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
    let $e = v ? P.outerHTML : P.innerHTML;
    return v && oe["!doctype"] && P.ownerDocument && P.ownerDocument.doctype && P.ownerDocument.doctype.name && At(Ec, P.ownerDocument.doctype.name) && ($e = "<!DOCTYPE " + P.ownerDocument.doctype.name + `>
` + $e), p && hi([ye, Ye, et], (xt) => {
      $e = Ts($e, xt, " ");
    }), T && z ? T.createHTML($e) : $e;
  }, t.setConfig = function() {
    let j = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    Mt(j), N = !0;
  }, t.clearConfig = function() {
    Pt = null, N = !1;
  }, t.isValidAttribute = function(j, _, P) {
    Pt || Mt({});
    const X = Ve(j), Be = Ve(_);
    return Dn(X, Be, P);
  }, t.addHook = function(j, _) {
    typeof _ == "function" && As(Ce[j], _);
  }, t.removeHook = function(j, _) {
    if (_ !== void 0) {
      const P = Rd(Ce[j], _);
      return P === -1 ? void 0 : Id(Ce[j], P, 1)[0];
    }
    return za(Ce[j]);
  }, t.removeHooks = function(j) {
    Ce[j] = [];
  }, t.removeAllHooks = function() {
    Ce = Ga();
  }, t;
}
var Ro = Cc();
Ro.addHook("uponSanitizeElement", (e, t) => {
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
Ro.addHook("afterSanitizeAttributes", (e) => {
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
function Kd(e) {
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
  return Ro.sanitize(e, t);
}
De.setOptions({
  renderer: new De.Renderer(),
  gfm: !0,
  breaks: !0
});
const Ai = (e) => Kd(De(e || "")), Gd = { class: "askai" }, Yd = { class: "askai__bar" }, Xd = ["value", "placeholder", "disabled", "aria-label", "onKeydown"], Zd = ["disabled", "title", "aria-label"], Jd = {
  key: 0,
  class: "askai__new-hint"
}, Qd = { class: "askai__intro" }, ep = { class: "askai__title" }, tp = {
  key: 0,
  class: "askai__subtitle"
}, np = {
  key: 0,
  class: "askai__suggestions"
}, sp = ["disabled", "onClick"], ip = ["aria-live"], rp = {
  key: 0,
  class: "askai__question"
}, op = {
  key: 1,
  class: "askai__system"
}, ap = ["innerHTML"], lp = {
  key: 0,
  class: "askai__sources"
}, cp = ["title"], up = {
  key: 0,
  class: "askai__thinking",
  role: "status",
  "aria-live": "polite"
}, fp = { class: "askai__thinking-text" }, hp = { class: "askai__foot" }, dp = { key: 0 }, pp = /* @__PURE__ */ Dl({
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
    }, D = typeof navigator < "u" && /Mac|iPod|iPhone|iPad/.test(navigator.platform || ""), F = (T) => {
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
      n.active && G(), window.addEventListener("keydown", F), o.value && typeof ResizeObserver < "u" && (ue = new ResizeObserver(() => ce()), ue.observe(o.value)), ce();
    }), zl(() => {
      window.removeEventListener("keydown", F), ue == null || ue.disconnect(), ue = null;
    }), (T, L) => (x(), A("div", Gd, [
      b("div", Yd, [
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
        }, null, 40, Xd),
        T.canStartNewChat ? (x(), A("button", {
          key: 0,
          type: "button",
          class: ze(["askai__new", { "askai__new--armed": T.newChatArmed }]),
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
          T.newChatArmed ? (x(), A("span", Jd, "Click again to confirm")) : se("", !0)
        ], 42, Zd)) : se("", !0),
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
          d.value ? (x(), A(Fe, { key: 1 }, [
            (x(!0), A(Fe, null, gt(l.value, ({ message: V, index: K }) => (x(), A("div", {
              key: K,
              class: "askai__turn",
              "aria-live": T.isStreaming(K) ? "off" : "polite"
            }, [
              V.message_type === "user" ? (x(), A("p", rp, ee(V.message), 1)) : V.message_type === "system" ? (x(), A("p", op, ee(V.message), 1)) : (x(), A(Fe, { key: 2 }, [
                b("div", {
                  class: ze(["askai__answer", { "askai__answer--streaming": T.isStreaming(K) }]),
                  innerHTML: E(Ai)(T.isStreaming(K) ? T.displayText(K, V.message || "") : V.message || "")
                }, null, 10, ap),
                T.showCitations && !T.isStreaming(K) && V.sources && V.sources.length ? (x(), A("div", lp, [
                  L[8] || (L[8] = b("span", { class: "askai__label" }, "Sources", -1)),
                  (x(!0), A(Fe, null, gt(V.sources, (xe, Pe) => (x(), A("span", {
                    key: Pe,
                    class: "askai__source",
                    title: T.citationTooltip(xe)
                  }, ee(T.citationLabel(xe)), 9, cp))), 128))
                ])) : se("", !0)
              ], 64))
            ], 8, ip))), 128)),
            T.loading ? (x(), A("div", up, [
              L[9] || (L[9] = b("span", { class: "askai__dot" }, null, -1)),
              L[10] || (L[10] = b("span", { class: "askai__dot" }, null, -1)),
              L[11] || (L[11] = b("span", { class: "askai__dot" }, null, -1)),
              b("span", fp, ee(T.showCitations ? "Searching the knowledge base" : "Thinking"), 1)
            ])) : se("", !0)
          ], 64)) : (x(), A(Fe, { key: 0 }, [
            b("div", Qd, [
              b("h2", ep, ee(T.welcomeTitle || `Ask ${T.agentName}`), 1),
              T.welcomeSubtitle ? (x(), A("p", tp, ee(T.welcomeSubtitle), 1)) : se("", !0)
            ]),
            T.suggestions.length && !T.draft.trim() ? (x(), A("div", np, [
              L[7] || (L[7] = b("p", { class: "askai__label" }, "Suggested", -1)),
              (x(!0), A(Fe, null, gt(T.suggestions, (V) => (x(), A("button", {
                key: V,
                type: "button",
                class: "askai__suggestion",
                disabled: !T.inputEnabled,
                onClick: (K) => k(V)
              }, [
                b("span", null, ee(V), 1),
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
              ], 8, sp))), 128))
            ])) : se("", !0)
          ], 64))
        ], 512)
      ], 512),
      b("div", hp, [
        T.disclaimer ? (x(), A("span", dp, ee(T.disclaimer), 1)) : se("", !0),
        L[12] || (L[12] = b("a", {
          class: "askai__brand",
          href: "https://chattermate.chat",
          target: "_blank",
          rel: "noopener noreferrer"
        }, "Powered by ChatterMate", -1))
      ])
    ]));
  }
}), Rc = (e, t) => {
  const n = e.__vccOpts || e;
  for (const [s, i] of t)
    n[s] = i;
  return n;
}, gp = /* @__PURE__ */ Rc(pp, [["__scopeId", "data-v-93559d14"]]), Os = [
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
], mp = (e) => (e || "").split("").reduce((t, n) => t + n.charCodeAt(0), 0) % Os.length, _p = (e) => {
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
}, yp = (e, t) => {
  const n = typeof t == "number" && Number.isFinite(t) ? t : mp(e);
  return _p(n);
}, Ya = (e) => {
  var t;
  return !!((t = e == null ? void 0 : e.attributes) != null && t.end_chat);
}, Xa = "AI can make mistakes. Check important info.";
function vp(e, t = !1) {
  return e !== !1 && !t;
}
const Ic = (e) => !!e && (/^https?:\/\//i.test(e) || e.startsWith("data:")), bp = (e, t) => e ? Ic(e) || e.startsWith("blob:") ? e : `${t.replace(/\/api\/v1\/?$/, "")}${e.startsWith("/") ? "" : "/"}${e}` : "";
function Za() {
  return typeof window < "u" && window.APP_CONFIG ? window.APP_CONFIG : {};
}
const Ks = {
  get API_URL() {
    return Za().API_URL || "https://api.chattermate.chat/api/v1";
  },
  get WS_URL() {
    return Za().WS_URL || "wss://api.chattermate.chat";
  }
};
function Ui(e) {
  return bp(e, Ks.API_URL);
}
function wp(e) {
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
const kp = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]), xp = /* @__PURE__ */ new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);
[...kp, ...xp];
function Ap(e, t) {
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
  }, F = async (L, V = 500) => new Promise((K, xe) => {
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
            const { blob: fe, base64: de } = await F(ye, 500), ae = fe.size;
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
          if (K.startsWith("/uploads/") ? K = K.substring(9) : K.startsWith("/") && (K = K.substring(1)), Ic(K))
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
const Zr = { type: "error", data: "parser error" }, Lc = typeof Blob == "function" || typeof Blob < "u" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]", Oc = typeof ArrayBuffer == "function", Nc = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e && e.buffer instanceof ArrayBuffer, Io = ({ type: e, data: t }, n, s) => Lc && t instanceof Blob ? n ? s(t) : Ja(t, s) : Oc && (t instanceof ArrayBuffer || Nc(t)) ? n ? s(t) : Ja(new Blob([t]), s) : s(un[e] + (t || "")), Ja = (e, t) => {
  const n = new FileReader();
  return n.onload = function() {
    const s = n.result.split(",")[1];
    t("b" + (s || ""));
  }, n.readAsDataURL(e);
};
function Qa(e) {
  return e instanceof Uint8Array ? e : e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
}
let Rr;
function Tp(e, t) {
  if (Lc && e.data instanceof Blob)
    return e.data.arrayBuffer().then(Qa).then(t);
  if (Oc && (e.data instanceof ArrayBuffer || Nc(e.data)))
    return t(Qa(e.data));
  Io(e, !1, (n) => {
    Rr || (Rr = new TextEncoder()), t(Rr.encode(n));
  });
}
const el = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", Ns = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (let e = 0; e < el.length; e++)
  Ns[el.charCodeAt(e)] = e;
const Sp = (e) => {
  let t = e.length * 0.75, n = e.length, s, i = 0, r, o, a, l;
  e[e.length - 1] === "=" && (t--, e[e.length - 2] === "=" && t--);
  const d = new ArrayBuffer(t), c = new Uint8Array(d);
  for (s = 0; s < n; s += 4)
    r = Ns[e.charCodeAt(s)], o = Ns[e.charCodeAt(s + 1)], a = Ns[e.charCodeAt(s + 2)], l = Ns[e.charCodeAt(s + 3)], c[i++] = r << 2 | o >> 4, c[i++] = (o & 15) << 4 | a >> 2, c[i++] = (a & 3) << 6 | l & 63;
  return d;
}, Ep = typeof ArrayBuffer == "function", Lo = (e, t) => {
  if (typeof e != "string")
    return {
      type: "message",
      data: Pc(e, t)
    };
  const n = e.charAt(0);
  return n === "b" ? {
    type: "message",
    data: Cp(e.substring(1), t)
  } : Ti[n] ? e.length > 1 ? {
    type: Ti[n],
    data: e.substring(1)
  } : {
    type: Ti[n]
  } : Zr;
}, Cp = (e, t) => {
  if (Ep) {
    const n = Sp(e);
    return Pc(n, t);
  } else
    return { base64: !0, data: e };
}, Pc = (e, t) => {
  switch (t) {
    case "blob":
      return e instanceof Blob ? e : new Blob([e]);
    case "arraybuffer":
    default:
      return e instanceof ArrayBuffer ? e : e.buffer;
  }
}, Mc = "", Rp = (e, t) => {
  const n = e.length, s = new Array(n);
  let i = 0;
  e.forEach((r, o) => {
    Io(r, !1, (a) => {
      s[o] = a, ++i === n && t(s.join(Mc));
    });
  });
}, Ip = (e, t) => {
  const n = e.split(Mc), s = [];
  for (let i = 0; i < n.length; i++) {
    const r = Lo(n[i], t);
    if (s.push(r), r.type === "error")
      break;
  }
  return s;
};
function Lp() {
  return new TransformStream({
    transform(e, t) {
      Tp(e, (n) => {
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
let Ir;
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
function Op(e, t) {
  Ir || (Ir = new TextDecoder());
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
            a.enqueue(Zr);
            break;
          }
          i = c * Math.pow(2, 32) + d.getUint32(4), s = 3;
        } else {
          if (pi(n) < i)
            break;
          const l = gi(n, i);
          a.enqueue(Lo(r ? l : Ir.decode(l), t)), s = 0;
        }
        if (i === 0 || i > e) {
          a.enqueue(Zr);
          break;
        }
      }
    }
  });
}
const Fc = 4;
function lt(e) {
  if (e) return Np(e);
}
function Np(e) {
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
const tr = typeof Promise == "function" && typeof Promise.resolve == "function" ? (t) => Promise.resolve().then(t) : (t, n) => n(t, 0), Ht = typeof self < "u" ? self : typeof window < "u" ? window : Function("return this")(), Pp = "arraybuffer";
function Dc(e, ...t) {
  return t.reduce((n, s) => (e.hasOwnProperty(s) && (n[s] = e[s]), n), {});
}
const Mp = Ht.setTimeout, Fp = Ht.clearTimeout;
function nr(e, t) {
  t.useNativeTimers ? (e.setTimeoutFn = Mp.bind(Ht), e.clearTimeoutFn = Fp.bind(Ht)) : (e.setTimeoutFn = Ht.setTimeout.bind(Ht), e.clearTimeoutFn = Ht.clearTimeout.bind(Ht));
}
const Dp = 1.33;
function Bp(e) {
  return typeof e == "string" ? $p(e) : Math.ceil((e.byteLength || e.size) * Dp);
}
function $p(e) {
  let t = 0, n = 0;
  for (let s = 0, i = e.length; s < i; s++)
    t = e.charCodeAt(s), t < 128 ? n += 1 : t < 2048 ? n += 2 : t < 55296 || t >= 57344 ? n += 3 : (s++, n += 4);
  return n;
}
function Bc() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
function Up(e) {
  let t = "";
  for (let n in e)
    e.hasOwnProperty(n) && (t.length && (t += "&"), t += encodeURIComponent(n) + "=" + encodeURIComponent(e[n]));
  return t;
}
function zp(e) {
  let t = {}, n = e.split("&");
  for (let s = 0, i = n.length; s < i; s++) {
    let r = n[s].split("=");
    t[decodeURIComponent(r[0])] = decodeURIComponent(r[1]);
  }
  return t;
}
class Hp extends Error {
  constructor(t, n, s) {
    super(t), this.description = n, this.context = s, this.type = "TransportError";
  }
}
class Oo extends lt {
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
    return super.emitReserved("error", new Hp(t, n, s)), this;
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
    const n = Lo(t, this.socket.binaryType);
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
    const n = Up(t);
    return n.length ? "?" + n : "";
  }
}
class qp extends Oo {
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
    Ip(t, this.socket.binaryType).forEach(n), this.readyState !== "closed" && (this._polling = !1, this.emitReserved("pollComplete"), this.readyState === "open" && this._poll());
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
    this.writable = !1, Rp(t, (n) => {
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
    return this.opts.timestampRequests !== !1 && (n[this.opts.timestampParam] = Bc()), !this.supportsBinary && !n.sid && (n.b64 = 1), this.createUri(t, n);
  }
}
let $c = !1;
try {
  $c = typeof XMLHttpRequest < "u" && "withCredentials" in new XMLHttpRequest();
} catch {
}
const Wp = $c;
function jp() {
}
class Vp extends qp {
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
    const n = Dc(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
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
      if (this._xhr.onreadystatechange = jp, t)
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
    attachEvent("onunload", tl);
  else if (typeof addEventListener == "function") {
    const e = "onpagehide" in Ht ? "pagehide" : "unload";
    addEventListener(e, tl, !1);
  }
}
function tl() {
  for (let e in ln.requests)
    ln.requests.hasOwnProperty(e) && ln.requests[e].abort();
}
const Kp = function() {
  const e = Uc({
    xdomain: !1
  });
  return e && e.responseType !== null;
}();
class Gp extends Vp {
  constructor(t) {
    super(t);
    const n = t && t.forceBase64;
    this.supportsBinary = Kp && !n;
  }
  request(t = {}) {
    return Object.assign(t, { xd: this.xd }, this.opts), new ln(Uc, this.uri(), t);
  }
}
function Uc(e) {
  const t = e.xdomain;
  try {
    if (typeof XMLHttpRequest < "u" && (!t || Wp))
      return new XMLHttpRequest();
  } catch {
  }
  if (!t)
    try {
      return new Ht[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch {
    }
}
const zc = typeof navigator < "u" && typeof navigator.product == "string" && navigator.product.toLowerCase() === "reactnative";
class Yp extends Oo {
  get name() {
    return "websocket";
  }
  doOpen() {
    const t = this.uri(), n = this.opts.protocols, s = zc ? {} : Dc(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
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
      Io(s, this.supportsBinary, (r) => {
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
    return this.opts.timestampRequests && (n[this.opts.timestampParam] = Bc()), this.supportsBinary || (n.b64 = 1), this.createUri(t, n);
  }
}
const Lr = Ht.WebSocket || Ht.MozWebSocket;
class Xp extends Yp {
  createSocket(t, n, s) {
    return zc ? new Lr(t, n, s) : n ? new Lr(t, n) : new Lr(t);
  }
  doWrite(t, n) {
    this.ws.send(n);
  }
}
class Zp extends Oo {
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
        const n = Op(Number.MAX_SAFE_INTEGER, this.socket.binaryType), s = t.readable.pipeThrough(n).getReader(), i = Lp();
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
const Jp = {
  websocket: Xp,
  webtransport: Zp,
  polling: Gp
}, Qp = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, eg = [
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
function Jr(e) {
  if (e.length > 8e3)
    throw "URI too long";
  const t = e, n = e.indexOf("["), s = e.indexOf("]");
  n != -1 && s != -1 && (e = e.substring(0, n) + e.substring(n, s).replace(/:/g, ";") + e.substring(s, e.length));
  let i = Qp.exec(e || ""), r = {}, o = 14;
  for (; o--; )
    r[eg[o]] = i[o] || "";
  return n != -1 && s != -1 && (r.source = t, r.host = r.host.substring(1, r.host.length - 1).replace(/;/g, ":"), r.authority = r.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), r.ipv6uri = !0), r.pathNames = tg(r, r.path), r.queryKey = ng(r, r.query), r;
}
function tg(e, t) {
  const n = /\/{2,9}/g, s = t.replace(n, "/").split("/");
  return (t.slice(0, 1) == "/" || t.length === 0) && s.splice(0, 1), t.slice(-1) == "/" && s.splice(s.length - 1, 1), s;
}
function ng(e, t) {
  const n = {};
  return t.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(s, i, r) {
    i && (n[i] = r);
  }), n;
}
const Qr = typeof addEventListener == "function" && typeof removeEventListener == "function", Si = [];
Qr && addEventListener("offline", () => {
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
    if (super(), this.binaryType = Pp, this.writeBuffer = [], this._prevBufferLen = 0, this._pingInterval = -1, this._pingTimeout = -1, this._maxPayload = -1, this._pingTimeoutTime = 1 / 0, t && typeof t == "object" && (n = t, t = null), t) {
      const s = Jr(t);
      n.hostname = s.host, n.secure = s.protocol === "https" || s.protocol === "wss", n.port = s.port, s.query && (n.query = s.query);
    } else n.host && (n.hostname = Jr(n.host).host);
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
    }, n), this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : ""), typeof this.opts.query == "string" && (this.opts.query = zp(this.opts.query)), Qr && (this.opts.closeOnBeforeunload && (this._beforeunloadEventListener = () => {
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
    n.EIO = Fc, n.transport = t, this.id && (n.sid = this.id);
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
      if (i && (n += Bp(i)), s > 0 && n > this._maxPayload)
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
      if (this.clearTimeoutFn(this._pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), Qr && (this._beforeunloadEventListener && removeEventListener("beforeunload", this._beforeunloadEventListener, !1), this._offlineEventListener)) {
        const s = Si.indexOf(this._offlineEventListener);
        s !== -1 && Si.splice(s, 1);
      }
      this.readyState = "closed", this.id = null, this.emitReserved("close", t, n), this.writeBuffer = [], this._prevBufferLen = 0;
    }
  }
}
Ln.protocol = Fc;
class sg extends Ln {
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
let ig = class extends sg {
  constructor(t, n = {}) {
    const s = typeof t == "object" ? t : n;
    (!s.transports || s.transports && typeof s.transports[0] == "string") && (s.transports = (s.transports || ["polling", "websocket", "webtransport"]).map((i) => Jp[i]).filter((i) => !!i)), super(t, s);
  }
};
function rg(e, t = "", n) {
  let s = e;
  n = n || typeof location < "u" && location, e == null && (e = n.protocol + "//" + n.host), typeof e == "string" && (e.charAt(0) === "/" && (e.charAt(1) === "/" ? e = n.protocol + e : e = n.host + e), /^(https?|wss?):\/\//.test(e) || (typeof n < "u" ? e = n.protocol + "//" + e : e = "https://" + e), s = Jr(e)), s.port || (/^(http|ws)$/.test(s.protocol) ? s.port = "80" : /^(http|ws)s$/.test(s.protocol) && (s.port = "443")), s.path = s.path || "/";
  const r = s.host.indexOf(":") !== -1 ? "[" + s.host + "]" : s.host;
  return s.id = s.protocol + "://" + r + ":" + s.port + t, s.href = s.protocol + "://" + r + (n && n.port === s.port ? "" : ":" + s.port), s;
}
const og = typeof ArrayBuffer == "function", ag = (e) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e.buffer instanceof ArrayBuffer, Hc = Object.prototype.toString, lg = typeof Blob == "function" || typeof Blob < "u" && Hc.call(Blob) === "[object BlobConstructor]", cg = typeof File == "function" || typeof File < "u" && Hc.call(File) === "[object FileConstructor]";
function No(e) {
  return og && (e instanceof ArrayBuffer || ag(e)) || lg && e instanceof Blob || cg && e instanceof File;
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
  if (No(e))
    return !0;
  if (e.toJSON && typeof e.toJSON == "function" && arguments.length === 1)
    return Ei(e.toJSON(), !0);
  for (const n in e)
    if (Object.prototype.hasOwnProperty.call(e, n) && Ei(e[n]))
      return !0;
  return !1;
}
function ug(e) {
  const t = [], n = e.data, s = e;
  return s.data = eo(n, t), s.attachments = t.length, { packet: s, buffers: t };
}
function eo(e, t) {
  if (!e)
    return e;
  if (No(e)) {
    const n = { _placeholder: !0, num: t.length };
    return t.push(e), n;
  } else if (Array.isArray(e)) {
    const n = new Array(e.length);
    for (let s = 0; s < e.length; s++)
      n[s] = eo(e[s], t);
    return n;
  } else if (typeof e == "object" && !(e instanceof Date)) {
    const n = {};
    for (const s in e)
      Object.prototype.hasOwnProperty.call(e, s) && (n[s] = eo(e[s], t));
    return n;
  }
  return e;
}
function fg(e, t) {
  return e.data = to(e.data, t), delete e.attachments, e;
}
function to(e, t) {
  if (!e)
    return e;
  if (e && e._placeholder === !0) {
    if (typeof e.num == "number" && e.num >= 0 && e.num < t.length)
      return t[e.num];
    throw new Error("illegal attachments");
  } else if (Array.isArray(e))
    for (let n = 0; n < e.length; n++)
      e[n] = to(e[n], t);
  else if (typeof e == "object")
    for (const n in e)
      Object.prototype.hasOwnProperty.call(e, n) && (e[n] = to(e[n], t));
  return e;
}
const hg = [
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
class dg {
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
    const n = ug(t), s = this.encodeAsString(n.packet), i = n.buffers;
    return i.unshift(s), i;
  }
}
function nl(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
class Po extends lt {
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
      s || n.type === Ie.BINARY_ACK ? (n.type = s ? Ie.EVENT : Ie.ACK, this.reconstructor = new pg(n), n.attachments === 0 && super.emitReserved("decoded", n)) : super.emitReserved("decoded", n);
    } else if (No(t) || t.base64)
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
      if (Po.isPayloadValid(s.type, r))
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
        return nl(n);
      case Ie.DISCONNECT:
        return n === void 0;
      case Ie.CONNECT_ERROR:
        return typeof n == "string" || nl(n);
      case Ie.EVENT:
      case Ie.BINARY_EVENT:
        return Array.isArray(n) && (typeof n[0] == "number" || typeof n[0] == "string" && hg.indexOf(n[0]) === -1);
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
class pg {
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
      const n = fg(this.reconPack, this.buffers);
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
const gg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Decoder: Po,
  Encoder: dg,
  get PacketType() {
    return Ie;
  }
}, Symbol.toStringTag, { value: "Module" }));
function Jt(e, t, n) {
  return e.on(t, n), function() {
    e.off(t, n);
  };
}
const mg = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
  newListener: 1,
  removeListener: 1
});
class qc extends lt {
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
    if (mg.hasOwnProperty(t))
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
class no extends lt {
  constructor(t, n) {
    var s;
    super(), this.nsps = {}, this.subs = [], t && typeof t == "object" && (n = t, t = void 0), n = n || {}, n.path = n.path || "/socket.io", this.opts = n, nr(this, n), this.reconnection(n.reconnection !== !1), this.reconnectionAttempts(n.reconnectionAttempts || 1 / 0), this.reconnectionDelay(n.reconnectionDelay || 1e3), this.reconnectionDelayMax(n.reconnectionDelayMax || 5e3), this.randomizationFactor((s = n.randomizationFactor) !== null && s !== void 0 ? s : 0.5), this.backoff = new us({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    }), this.timeout(n.timeout == null ? 2e4 : n.timeout), this._readyState = "closed", this.uri = t;
    const i = n.parser || gg;
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
    this.engine = new ig(this.uri, this.opts);
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
    return s ? this._autoConnect && !s.active && s.connect() : (s = new qc(this, t, n), this.nsps[t] = s), s;
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
  const n = rg(e, t.path || "/socket.io"), s = n.source, i = n.id, r = n.path, o = Rs[i] && r in Rs[i].nsps, a = t.forceNew || t["force new connection"] || t.multiplex === !1 || o;
  let l;
  return a ? l = new no(s, t) : (Rs[i] || (Rs[i] = new no(s, t)), l = Rs[i]), n.query && !t.query && (t.query = n.queryKey), l.socket(n.path, t);
}
Object.assign(Ci, {
  Manager: no,
  Socket: qc,
  io: Ci,
  connect: Ci
});
function _g() {
  const e = ie([]), t = ie(!1), n = ie(""), s = ie(!1), i = ie(!1), r = ie(!1), o = ie("connecting"), a = ie(0), l = 5, d = ie({}), c = ie(null), w = ie("");
  let k = null;
  const D = 6e4, F = () => {
    t.value = !1, k && (clearTimeout(k), k = null);
  }, G = () => {
    t.value = !0, k && clearTimeout(k), k = setTimeout(F, D);
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
      F(), o.value === "connected" && (console.log("Socket disconnected, setting connection status to connecting"), o.value = "connecting");
    }), H.on("connect_error", () => {
      a.value++, console.error("Socket connection failed, attempt:", a.value, "connection status:", o.value), a.value >= l && (o.value = "failed");
    }), H.on("chat_response", (v) => {
      if (F(), v.session_id ? (console.log("Captured session_id from chat_response:", v.session_id), w.value = v.session_id) : console.warn("No session_id in chat_response data:", v), v.type === "agent_message") {
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
      }, F(), ce && ce(v);
    }), H.on("session_initialized", (v) => {
      v.session_id && (console.log("Initialized session_id from session_initialized:", v.session_id), w.value = v.session_id);
    }), H.on("error", et), H.on("chat_history", rt), H.on("rating_submitted", fe), H.on("display_form", de), H.on("form_submitted", ae), H.on("workflow_state", Te), H.on("workflow_proceeded", tt), H;
  }, Pe = async () => {
    try {
      return o.value = "connecting", a.value = 0, H && (H.removeAllListeners(), H.disconnect(), H = null), H = xe(""), new Promise((W) => {
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
    F(), n.value = qh(W), s.value = !0, setTimeout(() => {
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
    console.log("Form display handler in composable:", W), F(), c.value = W.form_data, console.log("Set currentForm in handleDisplayForm:", c.value), ((st = W.form_data) == null ? void 0 : st.form_full_screen) === !0 ? (console.log("Full screen form detected, triggering workflow state callback"), ue && ue({
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
        for (let M = 0; M < I.length; M++)
          U[M] = I.charCodeAt(M);
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
    e.value = [], r.value = !1, w.value = "", F(), c.value = null;
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
      H && (H.removeAllListeners(), H.disconnect(), H = null), ce = null, ue = null, ge = null;
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
function yg(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Or = { exports: {} }, sl;
function vg() {
  return sl || (sl = 1, function(e) {
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
      function F(f, y, C, S) {
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
          F(this.c, (C.a.api || "https://fast.fonts.net/jsapi") + "/" + S + ".js" + ($ ? "?v=" + $ : ""), function(ne) {
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
      var M = { latin: "BESbswy", "latin-ext": "çöüğş", cyrillic: "йяЖ", greek: "αβΣ", khmer: "កខគ", Hanuman: "កខគ" }, J = { thin: "1", extralight: "2", "extra-light": "2", ultralight: "2", "ultra-light": "2", light: "3", regular: "4", book: "4", medium: "5", "semi-bold": "6", semibold: "6", "demi-bold": "6", demibold: "6", bold: "7", "extra-bold": "8", extrabold: "8", "ultra-bold": "8", ultrabold: "8", black: "9", heavy: "9", l: "3", r: "4", b: "7" }, q = { i: "i", italic: "i", n: "n", normal: "n" }, Z = /^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/;
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
            0 < ne.length && (Y = ne), S.length == 3 && (S = S[2], ne = [], S = S ? S.split(",") : ne, 0 < S.length && (S = M[S[0]]) && (f.c[$] = S));
          }
          for (f.c[$] || (S = M[$]) && (f.c[$] = S), S = 0; S < Y.length; S += 1) f.a.push(new T($, Y[S]));
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
        y ? F(this.c, (this.a.api || "https://use.typekit.net") + "/" + y + ".js", function(S) {
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
        }, F(this.c, (this.f.api || "https://f.fontdeck.com/s/css/js/") + k(this.c) + "/" + y + ".js", function($) {
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
  }(Or)), Or.exports;
}
var bg = vg();
const wg = /* @__PURE__ */ yg(bg), il = [
  "Space Grotesk:400,500,600,700",
  "Instrument Sans:400,500,600",
  "JetBrains Mono:400,500,600"
], kg = (e) => {
  const t = [...il], n = (e == null ? void 0 : e.split(",")[0].trim().replace(/['"]/g, "")) || "", s = il.some(
    (i) => i.toLowerCase().startsWith(n.toLowerCase())
  );
  n && !s && t.push(n), wg.load({
    google: { families: t },
    active: () => {
      if (!e) return;
      const i = document.querySelector(".chat-container");
      i && (i.style.fontFamily = e.includes(",") ? e : `"${e}", system-ui, sans-serif`);
    }
  });
};
function xg() {
  const e = ie({}), t = ie(""), n = (i) => {
    var r;
    e.value = i, i.photo_url && (e.value.photo_url = i.photo_url), kg(i.font_family), window.parent.postMessage({
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
const Ag = 13, Tg = 24;
function Sg(e, t) {
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
    const F = D[k.shown - 1];
    t == null || t(), o(F === " " ? Tg : Ag);
  };
  Wt(() => e.value.length, (c, w) => {
    w !== void 0 && c < w && (Object.keys(n).forEach((k) => {
      delete n[Number(k)];
    }), s.length = 0);
    for (let k = w ?? 0; k < c; k++) {
      const D = e.value[k];
      if (!D || !D.stream || k in n) continue;
      const F = D.message ?? "";
      r || !F ? n[k] = { shown: F.length, done: !0 } : (n[k] = { shown: 0, done: !1 }, s.push(k));
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
function Eg(e) {
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
const Cg = {
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
}, Rg = {
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
}, Ig = {
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
}, Lg = {
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
}, Og = {
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
}, Ng = {
  GLASS: Cg,
  AURORA: Rg,
  TERMINAL: Ig,
  CALM_MINT: Lg,
  PLAYFUL: Og,
  SUNRISE: Ri,
  CHATBOT: Ri,
  ASK_ANYTHING: Ri
}, Pg = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", rl = "'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
function Mg(e) {
  return Math.max(4, Math.round(e * 0.3));
}
function ol(e) {
  const t = (e || "").replace("#", "");
  if (t.length < 6) return "#0B0C10";
  const n = parseInt(t.slice(0, 2), 16), s = parseInt(t.slice(2, 4), 16), i = parseInt(t.slice(4, 6), 16);
  return (0.299 * n + 0.587 * s + 0.114 * i) / 255 > 0.62 ? "#0B0C10" : "#FFFFFF";
}
function Fg(e) {
  return Ng[e || ""] || Ri;
}
const Dg = "#212529";
function Bg(e, t) {
  const n = Fg(e), s = (t == null ? void 0 : t.chat_background_color) || "", i = /^#[0-9a-fA-F]{6}$/.test(s), r = s || n.card, o = (t == null ? void 0 : t.chat_text_color) || "", l = /^#[0-9a-fA-F]{6}$/.test(o) && o.toLowerCase() !== Dg ? o : i ? ls(s) ? "#FFFFFF" : "#111111" : n.text, d = i ? ls(s) ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)" : n.muted, c = i ? Hh(s, 20) : n.agentBg, w = (t == null ? void 0 : t.accent_color) || n.accent, k = i ? !ls(s) : n.light, D = ol(w) === "#0B0C10", F = k === D ? d : w, G = n.mono ? Pg : t != null && t.font_family ? `${t.font_family}, ${rl}` : rl;
  return {
    "--cm-card": r,
    "--cm-text": l,
    "--cm-muted": d,
    "--cm-agent-bg": c,
    "--cm-accent": w,
    "--cm-on-accent": ol(w),
    "--cm-presence": F,
    "--cm-border": n.border,
    "--cm-glow": n.glow,
    "--cm-radius": `${n.radius}px`,
    "--cm-bubble": `${n.bubble}px`,
    "--cm-bubble-tail": `${Mg(n.bubble)}px`,
    "--cm-field-radius": n.mono ? "7px" : "12px",
    "--cm-avatar-radius": n.mono ? "28%" : "50%",
    "--cm-hairline": n.light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)",
    "--cm-body-font": G
  };
}
function $g() {
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
const Ug = {
  key: 0,
  class: "widget-unavailable-overlay"
}, zg = {
  key: 1,
  class: "auth-error-overlay"
}, Hg = { class: "auth-error-card" }, qg = { class: "auth-error-message" }, Wg = {
  key: 0,
  class: "initializing-overlay"
}, jg = {
  key: 0,
  class: "connecting-message"
}, Vg = {
  key: 1,
  class: "failed-message"
}, Kg = { class: "welcome-content" }, Gg = { class: "welcome-header" }, Yg = ["src", "alt"], Xg = { class: "welcome-title" }, Zg = { class: "welcome-subtitle" }, Jg = { class: "welcome-input-container" }, Qg = {
  key: 0,
  class: "email-input"
}, em = ["disabled"], tm = { class: "welcome-message-input" }, nm = ["placeholder", "disabled"], sm = ["disabled"], im = {
  key: 0,
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, rm = {
  key: 1,
  width: "20",
  height: "20",
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, om = { class: "landing-page-content" }, am = { class: "landing-page-header" }, lm = { class: "landing-page-heading" }, cm = { class: "landing-page-text" }, um = { class: "landing-page-actions" }, fm = { class: "form-fullscreen-content" }, hm = {
  key: 0,
  class: "form-header"
}, dm = {
  key: 0,
  class: "form-title"
}, pm = {
  key: 1,
  class: "form-description"
}, gm = { class: "form-fields" }, mm = ["for"], _m = {
  key: 0,
  class: "required-indicator"
}, ym = ["id", "type", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "onBlur", "autocomplete", "inputmode"], vm = ["id", "placeholder", "required", "min", "max", "value", "onInput"], bm = ["id", "placeholder", "required", "minlength", "maxlength", "value", "onInput"], wm = ["id", "required", "value", "onChange"], km = { value: "" }, xm = ["value"], Am = {
  key: 4,
  class: "checkbox-field"
}, Tm = ["id", "required", "checked", "onChange"], Sm = { class: "checkbox-label" }, Em = {
  key: 5,
  class: "radio-group"
}, Cm = ["name", "value", "required", "checked", "onChange"], Rm = { class: "radio-label" }, Im = {
  key: 6,
  class: "field-error"
}, Lm = { class: "form-actions" }, Om = ["disabled"], Nm = {
  key: 0,
  class: "loading-spinner-inline"
}, Pm = { key: 1 }, Mm = { class: "header-content" }, Fm = ["src", "alt"], Dm = { class: "header-info" }, Bm = { class: "header-actions" }, $m = ["disabled", "title", "aria-label"], Um = {
  key: 0,
  class: "new-chat-hint"
}, zm = { class: "ask-anything-header" }, Hm = ["src", "alt"], qm = { class: "header-info" }, Wm = {
  key: 2,
  class: "loading-history"
}, jm = { class: "cm-email-gate-title" }, Vm = ["disabled"], Km = {
  key: 0,
  class: "cm-email-gate-error"
}, Gm = ["disabled"], Ym = {
  key: 0,
  class: "cm-welcome-block"
}, Xm = { class: "message agent-message cm-welcome-row" }, Zm = ["src", "alt"], Jm = {
  key: 0,
  class: "cm-msg-avatar",
  "aria-hidden": "true"
}, Qm = ["src"], e_ = ["src"], t_ = { class: "message-col" }, n_ = {
  key: 0,
  class: "rating-content"
}, s_ = { class: "rating-prompt" }, i_ = ["onMouseover", "onMouseleave", "onClick", "disabled"], r_ = {
  key: 0,
  class: "feedback-wrapper"
}, o_ = { class: "feedback-section" }, a_ = ["onUpdate:modelValue", "disabled"], l_ = { class: "feedback-counter" }, c_ = ["onClick", "disabled"], u_ = {
  key: 1,
  class: "submitted-feedback-wrapper"
}, f_ = { class: "submitted-feedback" }, h_ = { class: "submitted-feedback-text" }, d_ = {
  key: 2,
  class: "submitted-message"
}, p_ = {
  key: 1,
  class: "form-content"
}, g_ = {
  key: 0,
  class: "form-header"
}, m_ = {
  key: 0,
  class: "form-title"
}, __ = {
  key: 1,
  class: "form-description"
}, y_ = { class: "form-fields" }, v_ = ["for"], b_ = {
  key: 0,
  class: "required-indicator"
}, w_ = ["id", "type", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "onBlur", "disabled", "autocomplete", "inputmode"], k_ = ["id", "placeholder", "required", "min", "max", "value", "onInput", "disabled"], x_ = ["id", "placeholder", "required", "minlength", "maxlength", "value", "onInput", "disabled"], A_ = ["id", "required", "value", "onChange", "disabled"], T_ = { value: "" }, S_ = ["value"], E_ = {
  key: 4,
  class: "checkbox-field"
}, C_ = ["id", "checked", "onChange", "disabled"], R_ = ["for"], I_ = {
  key: 5,
  class: "radio-field"
}, L_ = ["id", "name", "value", "checked", "onChange", "disabled"], O_ = ["for"], N_ = {
  key: 6,
  class: "field-error"
}, P_ = { class: "form-actions" }, M_ = ["onClick", "disabled"], F_ = {
  key: 2,
  class: "user-input-content"
}, D_ = {
  key: 0,
  class: "user-input-prompt"
}, B_ = {
  key: 1,
  class: "user-input-form"
}, $_ = ["onUpdate:modelValue", "onKeydown"], U_ = ["onClick", "disabled"], z_ = {
  key: 2,
  class: "user-input-submitted"
}, H_ = {
  key: 0,
  class: "user-input-confirmation"
}, q_ = {
  key: 3,
  class: "product-message-container"
}, W_ = ["innerHTML"], j_ = {
  key: 1,
  class: "products-carousel"
}, V_ = { class: "carousel-items" }, K_ = {
  key: 0,
  class: "product-image-compact"
}, G_ = ["src", "alt"], Y_ = { class: "product-info-compact" }, X_ = { class: "product-text-area" }, Z_ = { class: "product-title-compact" }, J_ = {
  key: 0,
  class: "product-variant-compact"
}, Q_ = { class: "product-price-compact" }, ey = { class: "product-actions-compact" }, ty = ["onClick"], ny = {
  key: 2,
  class: "no-products-message"
}, sy = {
  key: 3,
  class: "no-products-message"
}, iy = ["innerHTML"], ry = ["innerHTML"], oy = {
  key: 2,
  class: "message-attachments"
}, ay = {
  key: 0,
  class: "attachment-image-container"
}, ly = ["src", "alt", "onClick"], cy = { class: "attachment-image-info" }, uy = ["href"], fy = { class: "attachment-size" }, hy = ["href"], dy = { class: "attachment-size" }, py = {
  key: 0,
  class: "citation-chips"
}, gy = ["title"], my = { class: "message-info" }, _y = {
  key: 0,
  class: "agent-name"
}, yy = {
  key: 4,
  class: "cm-quick-actions-bar"
}, vy = ["disabled", "onClick"], by = {
  key: 0,
  class: "file-previews-widget"
}, wy = {
  class: "file-preview-content-widget",
  style: { cursor: "pointer" }
}, ky = ["src", "alt", "onClick"], xy = ["onClick"], Ay = { class: "file-preview-info-widget" }, Ty = { class: "file-preview-name-widget" }, Sy = { class: "file-preview-size-widget" }, Ey = ["onClick"], Cy = {
  key: 1,
  class: "upload-progress-widget"
}, Ry = { class: "message-input" }, Iy = ["placeholder", "disabled"], Ly = ["disabled", "title"], Oy = ["disabled"], Ny = {
  key: 6,
  class: "new-conversation-section"
}, Py = { class: "conversation-ended-message" }, My = {
  key: 8,
  class: "rating-dialog"
}, Fy = { class: "rating-content" }, Dy = { class: "star-rating" }, By = ["onClick"], $y = { class: "rating-actions" }, Uy = ["disabled"], zy = {
  key: 0,
  class: "preview-modal-image-container"
}, Hy = ["src", "alt"], qy = { class: "preview-modal-filename" }, Wy = {
  key: 3,
  class: "widget-loading"
}, Is = "ctid", al = 3, jy = "image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls", Vy = /* @__PURE__ */ Dl({
  __name: "WidgetBuilder",
  props: {
    widgetId: {},
    token: {},
    initialAuthError: {}
  },
  setup(e) {
    var Go;
    const t = e, n = le(() => {
      var h;
      return t.widgetId || ((h = window.__INITIAL_DATA__) == null ? void 0 : h.widgetId);
    }), {
      customization: s,
      agentName: i,
      applyCustomization: r,
      initializeFromData: o
    } = xg(), { formatCurrency: a } = $g(), {
      messages: l,
      loading: d,
      errorMessage: c,
      showError: w,
      loadingHistory: k,
      hasStartedChat: D,
      connectionStatus: F,
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
    } = _g(), { displayText: de, isStreaming: ae } = Sg(l, () => os(() => An()));
    Eg(l);
    const Te = ie(""), tt = ie(!0), oe = ie(""), Le = ie(!1), Oe = (h) => {
      const g = h.target;
      Te.value = g.value;
    };
    let pt = null;
    const Re = () => {
      pt && pt.disconnect(), pt = new MutationObserver((g) => {
        let u = !1, Q = !1;
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
            he && (Q = !0, u = !0), Ge && (u = !0);
          }
        }), u && (clearTimeout(Re.timeoutId), Re.timeoutId = setTimeout(() => {
          ut();
        }, Q ? 50 : 100));
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
        const Q = document.querySelectorAll(u);
        if (Q.length > 0) {
          g = Array.from(Q);
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
      const Q = document.querySelector(".header-dropdown-menu");
      Q && !(u != null && u.contains(g)) && (Q.style.display = "none");
    }, v = ie(!0), N = (h) => !h || h === "undefined" || h === "null" || typeof h == "string" && h.trim() === "" ? null : h, R = ie(N(((Go = window.__INITIAL_DATA__) == null ? void 0 : Go.initialToken) || localStorage.getItem(Is)));
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
    const M = ie(!1);
    (B == null ? void 0 : B.allowAttachments) !== void 0 && (M.value = B.allowAttachments);
    const J = ie(null), {
      chatStyles: q,
      chatIconStyles: Z,
      agentBubbleStyles: te,
      userBubbleStyles: re,
      messageNameStyles: me,
      headerBorderStyles: Ae,
      photoUrl: Ne,
      shadowStyle: je
    } = wp(s), ft = ie(null), {
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
    } = Ap(R, ft);
    le(() => l.value.some(
      (h) => h.message_type === "form" && (!h.isSubmitted || h.isSubmitted === !1)
    ));
    const Mt = le(() => {
      var h;
      return D.value && Le.value || !cr.value ? F.value === "connected" && !d.value : ws(oe.value.trim()) && F.value === "connected" && !d.value || ((h = window.__INITIAL_DATA__) == null ? void 0 : h.workflow);
    }), Gn = le(() => F.value === "connected" ? zt.value ? "Ask me anything..." : "Type a message..." : "Connecting..."), en = async () => {
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
      var h, g, u, Q;
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
        return we.token && (R.value = we.token, localStorage.setItem(Is, we.token), window.parent.postMessage({ type: "TOKEN_UPDATE", token: we.token }, "*")), Le.value = !0, I.value = null, U.value = !1, rt(R.value || void 0), await ue() ? (await ei(), (h = we.agent) != null && h.customization && r(we.agent.customization), we.agent && !(we != null && we.human_agent) && (i.value = we.agent.name), we != null && we.human_agent && (L.value = we.human_agent), ((g = we.agent) == null ? void 0 : g.allow_attachments) !== void 0 && (M.value = we.agent.allow_attachments), ((u = we.agent) == null ? void 0 : u.workflow) !== void 0 && (window.__INITIAL_DATA__ = window.__INITIAL_DATA__ || {}, window.__INITIAL_DATA__.workflow = we.agent.workflow), (Q = we.agent) != null && Q.workflow && await Ke(), !0) : (console.error("Failed to connect to chat service"), I.value = "Failed to connect to chat service. Please try again.", U.value = !0, !1);
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
    }, { deep: !0 }), Wt(F, (h, g) => {
      h === "connected" && g !== "connected" && setTimeout(ut, 100);
    }), Wt(() => l.value.length, (h, g) => {
      h > 0 && g === 0 && setTimeout(ut, 100);
    });
    let hs = null;
    Wt(() => l.value, (h) => {
      const g = h[h.length - 1];
      !Ya(g) || g === hs || (hs = g, ps(g));
    }, { deep: !0 });
    const Gt = async () => {
      await ge() && await xn();
    }, ds = ie(!1), Dn = ie(0), Yn = ie(""), Ft = ie(0), Ut = ie(!1), j = ie({}), _ = ie(!1), P = ie({}), X = ie(!1), Be = ie(null), ht = ie("Start Chat"), Ze = ie(!1), $e = ie(null);
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
      var g, u, Q, ve, he;
      if (Ya(h)) {
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
        if ((Q = h.attributes) != null && Q.end_chat && ((ve = h.attributes) != null && ve.request_rating)) {
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
    }, Kc = async (h, g, u = null) => {
      try {
        Ut.value = !0, await K(g, u);
        const Q = l.value.find((ve) => ve.message_type === "rating");
        Q && (Q.isSubmitted = !0, Q.finalRating = g, Q.finalFeedback = u);
      } catch (Q) {
        console.error("Failed to submit rating:", Q);
      } finally {
        Ut.value = !1;
      }
    }, Gc = (h) => {
      const g = {};
      for (const u of h.fields) {
        const Q = j.value[u.name], ve = sr(u, Q);
        ve && (g[u.name] = ve);
      }
      return P.value = g, Object.keys(g).length === 0;
    }, Yc = async (h) => {
      if (!(_.value || !Gc(h)))
        try {
          _.value = !0, await xe(j.value);
          const u = l.value.findIndex(
            (Q) => Q.message_type === "form" && (!Q.isSubmitted || Q.isSubmitted === !1)
          );
          u !== -1 && l.value.splice(u, 1), j.value = {}, P.value = {};
        } catch (u) {
          console.error("Failed to submit form:", u);
        } finally {
          _.value = !1;
        }
    }, Ot = (h, g) => {
      var u, Q;
      if (j.value[h] = g, g && g.toString().trim() !== "") {
        let ve = null;
        if ((u = $e.value) != null && u.fields && (ve = $e.value.fields.find((he) => he.name === h)), !ve && ((Q = Pe.value) != null && Q.fields) && (ve = Pe.value.fields.find((he) => he.name === h)), ve) {
          const he = sr(ve, g);
          he ? (P.value[h] = he, console.log(`Validation error for ${h}:`, he)) : delete P.value[h];
        }
      } else
        delete P.value[h], console.log(`Cleared error for ${h}`);
    }, Xc = (h) => {
      const g = h.replace(/\D/g, "");
      return g.length >= 7 && g.length <= 15;
    }, sr = (h, g) => {
      if (h.required && (!g || g.toString().trim() === ""))
        return `${h.label} is required`;
      if (!g || g.toString().trim() === "")
        return null;
      if (h.type === "email" && !ws(g))
        return "Please enter a valid email address";
      if (h.type === "tel" && !Xc(g))
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
    }, Zc = async () => {
      if (!(_.value || !$e.value))
        try {
          _.value = !0, P.value = {};
          let h = !1;
          for (const g of $e.value.fields || []) {
            const u = j.value[g.name], Q = sr(g, u);
            Q && (P.value[g.name] = Q, h = !0, console.log(`Validation error for field ${g.name}:`, Q));
          }
          if (h) {
            _.value = !1, console.log("Validation failed, not submitting");
            return;
          }
          await xe(j.value), Ze.value = !1, $e.value = null, j.value = {};
        } catch (h) {
          console.error("Failed to submit full screen form:", h);
        } finally {
          _.value = !1, console.log("Full screen form submission completed");
        }
    }, Jc = (h, g) => {
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
    }, Qc = (h) => {
      if (!h) return "";
      let g = h.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "");
      const u = [];
      return g = g.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (Q, ve, he) => {
        const Ge = `__MARKDOWN_LINK_${u.length}__`;
        return console.log("Found markdown link:", Q, "-> placeholder:", Ge), u.push(Q), Ge;
      }), console.log("After replacing markdown links with placeholders:", g), console.log("Markdown links array:", u), g = g.replace(/https?:\/\/[^\s\)]+/g, "[link removed]"), console.log("After removing standalone URLs:", g), u.forEach((Q, ve) => {
        g = g.replace(`__MARKDOWN_LINK_${ve}__`, Q), console.log(`Restored markdown link ${ve}:`, Q);
      }), g = g.replace(/\n\s*\n\s*\n/g, `

`).trim(), g;
    }, Mo = ie(!1);
    ie(!1);
    const Fo = le(() => {
      var h;
      return !!((h = L.value) != null && h.human_agent_name);
    }), eu = le(() => M.value && Fo.value && f.value.length < al), tu = async () => {
      try {
        X.value = !1, Be.value = null, await Ce();
      } catch (h) {
        console.error("Failed to proceed workflow:", h);
      }
    }, ir = async (h) => {
      try {
        if (!h.userInputValue || !h.userInputValue.trim())
          return;
        const g = h.userInputValue.trim();
        h.isSubmitted = !0, h.submittedValue = g, await G(g, oe.value);
      } catch (g) {
        console.error("Failed to submit user input:", g), h.isSubmitted = !1, h.submittedValue = null;
      }
    }, rr = async () => {
      var h, g, u;
      try {
        let Q = 0;
        const ve = 50;
        for (; !((h = window.__INITIAL_DATA__) != null && h.widgetId) && Q < ve; )
          await new Promise((Ge) => setTimeout(Ge, 100)), Q++;
        return (g = window.__INITIAL_DATA__) != null && g.widgetId ? (fe(window.__INITIAL_DATA__.widgetId), await xn() ? ((u = window.__INITIAL_DATA__) != null && u.workflow && Le.value && await Ke(), !0) : (F.value = "connected", !1)) : (console.error("Widget data not available after waiting"), !1);
      } catch (Q) {
        return console.error("Failed to initialize widget:", Q), !1;
      }
    };
    window.addEventListener("message", (h) => {
      h.source === window.parent && (!h.data || typeof h.data.type != "string" || (h.data.type === "SCROLL_TO_BOTTOM" && An(), h.data.type === "TOKEN_RECEIVED" && localStorage.setItem(Is, h.data.token), h.data.type === "WIDGET_VISIBILITY" && (Vo.value = !!h.data.open), h.data.type === "WIDGET_DISPLAY" && (ur.value = {
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
    const nu = () => {
      V(async () => {
        await xn();
      }), ye((h) => {
        var g;
        if (ht.value = h.button_text || "Start Chat", h.type === "landing_page")
          Be.value = h.landing_page_data, X.value = !0, Ze.value = !1;
        else if (h.type === "form" || h.type === "display_form")
          if (((g = h.form_data) == null ? void 0 : g.form_full_screen) === !0)
            $e.value = h.form_data, Ze.value = !0, X.value = !1;
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
    }, su = async () => {
      try {
        await rr(), await Ke();
      } catch (h) {
        throw console.error("Failed to start new conversation:", h), h;
      }
    }, Do = le(
      () => {
        var h;
        return s.value.allow_new_chat === !0 && l.value.length > 0 && !((h = L.value) != null && h.human_agent_name) && !Bn.value;
      }
    ), Xn = ie(!1), Tn = ie(!1);
    let si = null;
    const ii = () => {
      Tn.value = !1, si && (clearTimeout(si), si = null);
    }, Bo = () => {
      if (!Xn.value) {
        if (!Tn.value) {
          Tn.value = !0, si = setTimeout(ii, 8e3);
          return;
        }
        ii(), iu();
      }
    }, iu = async () => {
      if (!Xn.value) {
        Xn.value = !0;
        try {
          await H(), L.value = {}, Te.value = "", f.value = [], await rr();
        } catch (h) {
          console.error("Failed to start a new chat:", h);
        } finally {
          Xn.value = !1;
        }
      }
    }, ru = async () => {
      xt.value = !1, l.value = [], L.value = {}, await su();
    };
    Yi(async () => {
      await rr(), nu(), Re(), document.addEventListener("click", m), (() => {
        const g = l.value.length > 0, u = F.value === "connected", Q = document.querySelector('input[type="text"], textarea') !== null;
        return g || u || Q;
      })() && setTimeout(ut, 100);
    }), Ys(() => {
      window.removeEventListener("message", (h) => {
        h.data.type === "SCROLL_TO_BOTTOM" && An();
      }), document.removeEventListener("click", m), pt && (pt.disconnect(), pt = null), Re.timeoutId && (clearTimeout(Re.timeoutId), Re.timeoutId = null), Lt(), T();
    });
    const Zn = le(() => s.value.chat_style === "AURORA"), zt = le(() => s.value.chat_style === "ASK_ANYTHING" || Zn.value), $o = le(() => s.value.customization_metadata), ri = le(() => {
      var g;
      const h = (g = $o.value) == null ? void 0 : g.avatar_style;
      return h === "orb" ? !0 : h === "photo" ? !1 : Zn.value && !s.value.photo_url;
    }), gs = le(() => {
      var h;
      return yp(i.value || "", (h = $o.value) == null ? void 0 : h.orb_variant);
    }), ou = {
      GLASS: "theme-glass",
      TERMINAL: "theme-terminal",
      PLAYFUL: "theme-playful",
      CALM_MINT: "theme-calm",
      SUNRISE: "theme-sunrise"
    }, au = le(() => ou[s.value.chat_style] || ""), lu = le(() => Bg(s.value.chat_style, {
      chat_background_color: s.value.chat_background_color,
      chat_text_color: s.value.chat_text_color,
      accent_color: s.value.accent_color,
      font_family: s.value.font_family
    })), or = le(
      () => Array.isArray(s.value.quick_actions) ? s.value.quick_actions.filter((h) => !!h && h.trim().length > 0) : []
    ), Uo = le(() => (s.value.welcome_message || "").trim()), zo = le(
      () => !zt.value && l.value.length === 0 && !k.value && !Bn.value
    ), cu = le(
      () => zo.value && Uo.value.length > 0
    ), uu = le(
      () => zo.value && !xt.value && or.value.length > 0
    ), oi = le(() => s.value.show_citations === !0), Ho = le(() => vp(s.value.show_ai_disclaimer, Fo.value)), fu = (h) => /^[0-9a-f]{16,}$/i.test(h) || /^[0-9a-f-]{32,}$/i.test(h), ar = (h) => {
      const g = (h || "").trim().toLowerCase();
      return !g || g === "unknown" ? "Knowledge base" : g.charAt(0).toUpperCase() + g.slice(1);
    }, lr = (h) => {
      let g = ((h == null ? void 0 : h.name) || "").trim();
      return !g || (g = g.replace(/^[0-9a-f]{16,}[_-]/i, "").replace(/\.(pdf|txt|md|html?|docx?|csv|json)$/i, ""), !g || fu(g)) ? ar(h == null ? void 0 : h.type) : g;
    }, qo = (h) => {
      const g = lr(h), u = ar(h == null ? void 0 : h.type);
      return g === u ? u : `${g} · ${u}`;
    }, cr = le(() => s.value.collect_email === !0 && !zt.value), Wo = ie(!1), Sn = ie(""), ms = ie(!1), Bn = le(() => !D.value && cr.value && !Wo.value), jo = async () => {
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
        await xn(), Wo.value = !0;
      } catch {
        Sn.value = "Something went wrong. Please try again.";
      } finally {
        ms.value = !1;
      }
    }, ur = ie(null), Vo = ie(!0), fr = { mode: "floating", width: 400, height: 560 }, ai = le(
      () => {
        var h;
        return ur.value || ((h = s.value.customization_metadata) == null ? void 0 : h.widget_display) || null;
      }
    ), hu = le(() => {
      const h = ai.value;
      return h ? typeof h.mode == "string" && h.mode !== fr.mode || typeof h.width == "number" && h.width !== fr.width || typeof h.height == "number" && h.height !== fr.height : !1;
    }), du = le(() => {
      var g;
      const h = {
        width: "100%",
        height: "100%",
        borderRadius: "var(--radius-lg)"
      };
      if (hu.value) {
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
    }), Ko = le(() => zt.value && l.value.length === 0), pu = ["form", "user_input", "rating", "product", "shopify_output"], gu = le(
      () => l.value.some(
        (h) => pu.includes(h.message_type) || Array.isArray(h.attachments) && h.attachments.length > 0
      )
    ), mu = le(() => {
      var g, u;
      return zt.value ? !0 : (((g = ai.value) == null ? void 0 : g.mode) === "ask-ai" || ((u = ai.value) == null ? void 0 : u.mode) === "search-bar") && !M.value;
    }), hr = le(
      () => mu.value && tt.value && !X.value && !Ze.value && !Bn.value && !xt.value && !gu.value
    );
    Wt(hr, (h) => {
      window.parent.postMessage({ type: "WIDGET_SURFACE", palette: h }, "*");
    }, { immediate: !0 });
    const _u = le(
      () => s.value.welcome_subtitle || `Ask a question — ${i.value || "the assistant"} answers from what it knows.`
    ), yu = le(() => {
      var h;
      return ((h = ur.value) == null ? void 0 : h.hotkey) !== !1;
    });
    return (h, g) => U.value && z.value ? (x(), A("div", Ug, [
      b("button", {
        type: "button",
        class: "cm-error-close",
        "aria-label": "Close chat",
        title: "Close",
        onClick: kt
      }, "×"),
      g[20] || (g[20] = zn('<div class="widget-unavailable-card" data-v-17e4cd7f><div class="widget-unavailable-icon-wrapper" data-v-17e4cd7f><svg class="widget-unavailable-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-v-17e4cd7f><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" data-v-17e4cd7f></path><path d="M9 12l2 2 4-4" data-v-17e4cd7f></path></svg></div><h2 class="widget-unavailable-title" data-v-17e4cd7f>Chat Unavailable</h2><p class="widget-unavailable-message" data-v-17e4cd7f> This chat widget is not currently configured. Please contact the website administrator to enable chat support. </p><div class="widget-unavailable-footer" data-v-17e4cd7f><svg class="chattermate-logo-small" width="14" height="14" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-17e4cd7f><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-17e4cd7f></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-17e4cd7f><span class="cm-powered-prefix" data-v-17e4cd7f>Powered by </span><strong class="cm-brand" data-v-17e4cd7f>ChatterMate</strong></a></div></div>', 1))
    ])) : U.value ? (x(), A("div", zg, [
      b("button", {
        type: "button",
        class: "cm-error-close",
        "aria-label": "Close chat",
        title: "Close",
        onClick: kt
      }, "×"),
      b("div", Hg, [
        g[21] || (g[21] = zn('<div class="auth-error-header" data-v-17e4cd7f><svg class="auth-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-17e4cd7f><circle cx="12" cy="12" r="10" data-v-17e4cd7f></circle><line x1="12" y1="8" x2="12" y2="12" data-v-17e4cd7f></line><line x1="12" y1="16" x2="12.01" y2="16" data-v-17e4cd7f></line></svg><h2 data-v-17e4cd7f>Authentication Error</h2></div>', 1)),
        b("p", qg, ee(I.value), 1),
        b("button", {
          class: "auth-error-refresh-btn",
          onClick: g[0] || (g[0] = () => h.window.location.reload())
        }, " Refresh Page ")
      ])
    ])) : n.value && !U.value ? (x(), A("div", {
      key: 2,
      class: ze(["chat-container cm-surface", [{ collapsed: !tt.value, "ask-anything-style": zt.value, aurora: Zn.value }, au.value]]),
      style: ke({ ...E(je), ...du.value, ...lu.value })
    }, [
      v.value ? (x(), A("div", Wg, g[22] || (g[22] = [
        zn('<div class="loading-spinner" data-v-17e4cd7f><div class="dot" data-v-17e4cd7f></div><div class="dot" data-v-17e4cd7f></div><div class="dot" data-v-17e4cd7f></div></div><div class="loading-text" data-v-17e4cd7f>Initializing chat...</div>', 2)
      ]))) : se("", !0),
      !v.value && E(F) !== "connected" ? (x(), A("div", {
        key: 1,
        class: ze(["connection-status", E(F)])
      }, [
        E(F) === "connecting" ? (x(), A("div", jg, g[23] || (g[23] = [
          dn(" Connecting to chat service... ", -1),
          b("div", { class: "loading-dots" }, [
            b("div", { class: "dot" }),
            b("div", { class: "dot" }),
            b("div", { class: "dot" })
          ], -1)
        ]))) : E(F) === "failed" ? (x(), A("div", Vg, [
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
      }, ee(E(c)), 5)) : se("", !0),
      hr.value ? (x(), oc(gp, {
        key: 3,
        messages: E(l),
        draft: Te.value,
        "agent-name": E(i),
        suggestions: or.value,
        "welcome-title": E(s).welcome_title,
        "welcome-subtitle": _u.value,
        placeholder: Gn.value,
        "input-enabled": Mt.value,
        loading: E(d),
        "show-citations": oi.value,
        disclaimer: Ho.value ? E(Xa) : "",
        active: Vo.value,
        hotkey: yu.value,
        "can-start-new-chat": Do.value,
        "starting-new-chat": Xn.value,
        "new-chat-armed": Tn.value,
        onNewChat: Bo,
        onCancelNewChat: ii,
        "citation-label": lr,
        "citation-tooltip": qo,
        "display-text": E(de),
        "is-streaming": E(ae),
        "onUpdate:draft": g[1] || (g[1] = (u) => Te.value = u),
        onSend: en,
        onAsk: Qs,
        onClose: kt
      }, null, 8, ["messages", "draft", "agent-name", "suggestions", "welcome-title", "welcome-subtitle", "placeholder", "input-enabled", "loading", "show-citations", "disclaimer", "active", "hotkey", "can-start-new-chat", "starting-new-chat", "new-chat-armed", "display-text", "is-streaming"])) : Ko.value ? (x(), A("div", {
        key: 4,
        class: ze(["welcome-message-section", { aurora: Zn.value }]),
        style: ke(E(q))
      }, [
        b("div", Kg, [
          b("div", Gg, [
            ri.value ? (x(), A("div", {
              key: 0,
              class: "welcome-orb",
              style: ke(gs.value)
            }, null, 4)) : E(Ne) ? (x(), A("img", {
              key: 1,
              src: E(Ne),
              alt: E(i),
              class: "welcome-avatar"
            }, null, 8, Yg)) : se("", !0),
            b("h1", Xg, ee(E(s).welcome_title || `Welcome to ${E(i)}`), 1),
            b("p", Zg, ee(E(s).welcome_subtitle || "I'm here to help you with anything you need. What can I assist you with today?"), 1)
          ])
        ]),
        b("div", Jg, [
          !E(D) && !Le.value && cr.value ? (x(), A("div", Qg, [
            En(b("input", {
              "onUpdate:modelValue": g[2] || (g[2] = (u) => oe.value = u),
              type: "email",
              placeholder: "Enter your email address",
              disabled: E(d) || E(F) !== "connected",
              class: ze([{
                invalid: oe.value.trim() && !E(ws)(oe.value.trim()),
                disabled: E(F) !== "connected"
              }, "welcome-email-input"])
            }, null, 10, em), [
              [Hn, oe.value]
            ])
          ])) : se("", !0),
          b("div", tm, [
            En(b("input", {
              "onUpdate:modelValue": g[3] || (g[3] = (u) => Te.value = u),
              type: "text",
              placeholder: Gn.value,
              onKeypress: fn,
              onInput: Oe,
              onChange: Oe,
              disabled: !Mt.value,
              class: ze([{ disabled: !Mt.value }, "welcome-message-field"])
            }, null, 42, nm), [
              [Hn, Te.value]
            ]),
            b("button", {
              class: ze(["welcome-send-button", { "aurora-send": Zn.value }]),
              style: ke(E(re)),
              onClick: en,
              disabled: !Te.value.trim() || !Mt.value
            }, [
              Zn.value ? (x(), A("svg", im, g[25] || (g[25] = [
                b("path", {
                  d: "M12 19V5M12 5L5 12M12 5L19 12",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, null, -1)
              ]))) : (x(), A("svg", rm, g[26] || (g[26] = [
                b("path", {
                  d: "M5 12L3 21L21 12L3 3L5 12ZM5 12L13 12",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, null, -1)
              ])))
            ], 14, sm)
          ])
        ]),
        b("div", {
          class: "powered-by-welcome",
          style: ke(E(me))
        }, g[27] || (g[27] = [
          zn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-17e4cd7f><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-17e4cd7f></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-17e4cd7f><span class="cm-powered-prefix" data-v-17e4cd7f>Powered by </span><strong class="cm-brand" data-v-17e4cd7f>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 6)) : se("", !0),
      X.value && Be.value ? (x(), A("div", {
        key: 5,
        class: "landing-page-fullscreen",
        style: ke(E(q))
      }, [
        b("div", om, [
          b("div", am, [
            b("h2", lm, ee(Be.value.heading), 1),
            b("div", cm, ee(Be.value.content), 1)
          ]),
          b("div", um, [
            b("button", {
              class: "landing-page-button",
              onClick: tu
            }, ee(ht.value), 1)
          ])
        ]),
        b("div", {
          class: "powered-by-landing",
          style: ke(E(me))
        }, g[28] || (g[28] = [
          zn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-17e4cd7f><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-17e4cd7f></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-17e4cd7f><span class="cm-powered-prefix" data-v-17e4cd7f>Powered by </span><strong class="cm-brand" data-v-17e4cd7f>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 4)) : Ze.value && $e.value ? (x(), A("div", {
        key: 6,
        class: "form-fullscreen",
        style: ke(E(q))
      }, [
        b("div", fm, [
          $e.value.title || $e.value.description ? (x(), A("div", hm, [
            $e.value.title ? (x(), A("h2", dm, ee($e.value.title), 1)) : se("", !0),
            $e.value.description ? (x(), A("p", pm, ee($e.value.description), 1)) : se("", !0)
          ])) : se("", !0),
          b("div", gm, [
            (x(!0), A(Fe, null, gt($e.value.fields, (u) => {
              var Q, ve;
              return x(), A("div", {
                key: u.name,
                class: "form-field"
              }, [
                b("label", {
                  for: `fullscreen-form-${u.name}`,
                  class: "field-label"
                }, [
                  dn(ee(u.label) + " ", 1),
                  u.required ? (x(), A("span", _m, "*")) : se("", !0)
                ], 8, mm),
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
                  class: ze(["form-input", { error: P.value[u.name] }]),
                  autocomplete: u.type === "email" ? "email" : u.type === "tel" ? "tel" : "off",
                  inputmode: u.type === "tel" ? "tel" : u.type === "email" ? "email" : "text"
                }, null, 42, ym)) : u.type === "number" ? (x(), A("input", {
                  key: 1,
                  id: `fullscreen-form-${u.name}`,
                  type: "number",
                  placeholder: u.placeholder || "",
                  required: u.required,
                  min: u.minLength,
                  max: u.maxLength,
                  value: j.value[u.name] || "",
                  onInput: (he) => Ot(u.name, he.target.value),
                  class: ze(["form-input", { error: P.value[u.name] }])
                }, null, 42, vm)) : u.type === "textarea" ? (x(), A("textarea", {
                  key: 2,
                  id: `fullscreen-form-${u.name}`,
                  placeholder: u.placeholder || "",
                  required: u.required,
                  minlength: u.minLength,
                  maxlength: u.maxLength,
                  value: j.value[u.name] || "",
                  onInput: (he) => Ot(u.name, he.target.value),
                  class: ze(["form-textarea", { error: P.value[u.name] }]),
                  rows: "4"
                }, null, 42, bm)) : u.type === "select" ? (x(), A("select", {
                  key: 3,
                  id: `fullscreen-form-${u.name}`,
                  required: u.required,
                  value: j.value[u.name] || "",
                  onChange: (he) => Ot(u.name, he.target.value),
                  class: ze(["form-select", { error: P.value[u.name] }])
                }, [
                  b("option", km, ee(u.placeholder || "Please select..."), 1),
                  (x(!0), A(Fe, null, gt((Array.isArray(u.options) ? u.options : ((Q = u.options) == null ? void 0 : Q.split(`
`)) || []).filter((he) => he.trim()), (he) => (x(), A("option", {
                    key: he,
                    value: he.trim()
                  }, ee(he.trim()), 9, xm))), 128))
                ], 42, wm)) : u.type === "checkbox" ? (x(), A("label", Am, [
                  b("input", {
                    id: `fullscreen-form-${u.name}`,
                    type: "checkbox",
                    required: u.required,
                    checked: j.value[u.name] || !1,
                    onChange: (he) => Ot(u.name, he.target.checked),
                    class: "form-checkbox"
                  }, null, 40, Tm),
                  b("span", Sm, ee(u.label), 1)
                ])) : u.type === "radio" ? (x(), A("div", Em, [
                  (x(!0), A(Fe, null, gt((Array.isArray(u.options) ? u.options : ((ve = u.options) == null ? void 0 : ve.split(`
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
                    }, null, 40, Cm),
                    b("span", Rm, ee(he.trim()), 1)
                  ]))), 128))
                ])) : se("", !0),
                P.value[u.name] ? (x(), A("div", Im, ee(P.value[u.name]), 1)) : se("", !0)
              ]);
            }), 128))
          ]),
          b("div", Lm, [
            b("button", {
              onClick: g[4] || (g[4] = () => {
                console.log("Submit button clicked!"), Zc();
              }),
              disabled: _.value,
              class: "submit-form-button",
              style: ke(E(re))
            }, [
              _.value ? (x(), A("span", Nm, g[29] || (g[29] = [
                b("div", { class: "dot" }, null, -1),
                b("div", { class: "dot" }, null, -1),
                b("div", { class: "dot" }, null, -1)
              ]))) : (x(), A("span", Pm, ee($e.value.submit_button_text || "Submit"), 1))
            ], 12, Om)
          ])
        ]),
        b("div", {
          class: "powered-by-landing",
          style: ke(E(me))
        }, g[30] || (g[30] = [
          zn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-17e4cd7f><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-17e4cd7f></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-17e4cd7f><span class="cm-powered-prefix" data-v-17e4cd7f>Powered by </span><strong class="cm-brand" data-v-17e4cd7f>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 4)) : !Ko.value && tt.value && !hr.value ? (x(), A("div", {
        key: 7,
        class: ze(["chat-panel", { "ask-anything-chat": zt.value }]),
        style: ke(E(q))
      }, [
        zt.value ? (x(), A("div", {
          key: 1,
          class: "ask-anything-top",
          style: ke(E(Ae))
        }, [
          b("div", zm, [
            Dt.value || E(Ne) ? (x(), A("img", {
              key: 0,
              src: Dt.value || E(Ne),
              alt: E(L).human_agent_name || E(i),
              class: "header-avatar"
            }, null, 8, Hm)) : se("", !0),
            b("div", qm, [
              b("h3", {
                style: ke(E(me))
              }, ee(E(i)), 5),
              b("p", {
                class: "ask-anything-subtitle",
                style: ke(E(me))
              }, ee(E(s).welcome_subtitle || "Ask me anything. I'm here to help."), 5)
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
          b("div", Mm, [
            !Dt.value && (ri.value || !E(Ne)) ? (x(), A("div", {
              key: 0,
              class: "header-orb",
              style: ke(gs.value)
            }, null, 4)) : Dt.value || E(Ne) ? (x(), A("img", {
              key: 1,
              src: Dt.value || E(Ne),
              alt: E(L).human_agent_name || E(i),
              class: "header-avatar"
            }, null, 8, Fm)) : se("", !0),
            b("div", Dm, [
              b("h3", {
                style: ke(E(me))
              }, ee(E(L).human_agent_name || E(i)), 5),
              g[31] || (g[31] = b("div", { class: "status" }, [
                b("span", { class: "status-indicator online" }),
                b("span", { class: "status-text cm-presence" }, "Online · replies instantly")
              ], -1))
            ])
          ]),
          b("div", Bm, [
            Do.value ? (x(), A("button", {
              key: 0,
              type: "button",
              class: ze(["header-new-chat", { armed: Tn.value }]),
              style: ke(E(me)),
              disabled: Xn.value,
              title: Tn.value ? "This ends the current chat — click again to confirm" : "Start a new chat",
              "aria-label": Tn.value ? "Confirm starting a new chat" : "Start a new chat",
              onClick: Bo,
              onBlur: ii
            }, [
              g[32] || (g[32] = b("svg", {
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
              Tn.value ? (x(), A("span", Um, "Click again to start a new chat")) : se("", !0)
            ], 46, $m)) : se("", !0),
            b("button", {
              type: "button",
              class: "header-minimize",
              style: ke(E(me)),
              title: "Minimize",
              "aria-label": "Minimize chat",
              onClick: kt
            }, g[33] || (g[33] = [
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
        E(k) ? (x(), A("div", Wm, g[34] || (g[34] = [
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
          b("h3", jm, ee(E(s).welcome_title || "Before we start"), 1),
          g[35] || (g[35] = b("p", { class: "cm-email-gate-text" }, "Enter your email and we'll continue the chat.", -1)),
          En(b("input", {
            "onUpdate:modelValue": g[5] || (g[5] = (u) => oe.value = u),
            type: "email",
            inputmode: "email",
            autocomplete: "email",
            placeholder: "you@example.com",
            class: ze(["cm-email-gate-input", { invalid: !!Sn.value }]),
            disabled: ms.value,
            onKeyup: wi(jo, ["enter"]),
            onInput: g[6] || (g[6] = (u) => Sn.value = "")
          }, null, 42, Vm), [
            [Hn, oe.value]
          ]),
          Sn.value ? (x(), A("p", Km, ee(Sn.value), 1)) : se("", !0),
          b("button", {
            type: "button",
            class: "cm-email-gate-btn",
            style: ke(E(re)),
            disabled: ms.value,
            onClick: jo
          }, ee(ms.value ? "Please wait…" : "Continue to chat"), 13, Gm)
        ], 4)) : se("", !0),
        En(b("div", {
          class: "chat-messages",
          ref_key: "messagesContainer",
          ref: J
        }, [
          cu.value ? (x(), A("div", Ym, [
            b("div", Xm, [
              ri.value || !E(Ne) ? (x(), A("div", {
                key: 0,
                class: "cm-welcome-orb",
                style: ke(gs.value)
              }, null, 4)) : (x(), A("img", {
                key: 1,
                src: E(Ne),
                alt: E(i),
                class: "cm-welcome-avatar"
              }, null, 8, Zm)),
              b("div", {
                class: "message-bubble cm-welcome-bubble",
                style: ke(E(te))
              }, ee(Uo.value), 5)
            ])
          ])) : se("", !0),
          (x(!0), A(Fe, null, gt(E(l), (u, Q) => {
            var ve, he, Ge, we, Yt, _s, Jn, Yo, Xo, Zo, Jo, Qo, ea, ta, na, sa, ia, ra, oa;
            return x(), A("div", {
              key: Q,
              class: ze([
                "message",
                u.message_type === "bot" || u.message_type === "agent" ? "agent-message" : u.message_type === "system" ? "system-message" : u.message_type === "rating" ? "rating-message" : u.message_type === "form" ? "form-message" : u.message_type === "product" || u.shopify_output ? "product-message" : "user-message"
              ])
            }, [
              u.message_type === "bot" || u.message_type === "agent" ? (x(), A("div", Jm, [
                Dt.value ? (x(), A("img", {
                  key: 0,
                  src: Dt.value,
                  class: "cm-msg-avatar-img",
                  alt: ""
                }, null, 8, Qm)) : !ri.value && E(Ne) ? (x(), A("img", {
                  key: 1,
                  src: E(Ne),
                  class: "cm-msg-avatar-img",
                  alt: ""
                }, null, 8, e_)) : (x(), A("div", {
                  key: 2,
                  class: "cm-msg-avatar-orb",
                  style: ke(gs.value)
                }, null, 4))
              ])) : se("", !0),
              b("div", t_, [
                b("div", {
                  class: "message-bubble",
                  style: ke(u.message_type === "system" || u.message_type === "rating" || u.message_type === "form" || u.message_type === "product" || u.shopify_output ? {} : u.message_type === "user" ? E(re) : E(te))
                }, [
                  u.message_type === "rating" ? (x(), A("div", n_, [
                    b("p", s_, "Rate the chat session that you had with " + ee(u.agent_name || E(L).human_agent_name || E(i) || "our agent"), 1),
                    b("div", {
                      class: ze(["star-rating", { submitted: Ut.value || u.isSubmitted }])
                    }, [
                      (x(), A(Fe, null, gt(5, (O) => b("button", {
                        key: O,
                        class: ze(["star-button", {
                          warning: O <= (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating) && (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating) <= 3,
                          success: O <= (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating) && (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating) > 3,
                          selected: O <= (u.isSubmitted ? u.finalRating : Ft.value || u.selectedRating)
                        }]),
                        onMouseover: (Xt) => !u.isSubmitted && dt(O),
                        onMouseleave: (Xt) => !u.isSubmitted && ti,
                        onClick: (Xt) => !u.isSubmitted && ni(O),
                        disabled: Ut.value || u.isSubmitted
                      }, " ★ ", 42, i_)), 64))
                    ], 2),
                    u.showFeedback && !u.isSubmitted ? (x(), A("div", r_, [
                      b("div", o_, [
                        En(b("input", {
                          "onUpdate:modelValue": (O) => u.feedback = O,
                          placeholder: "Please share your feedback (optional)",
                          disabled: Ut.value,
                          maxlength: "500",
                          class: "feedback-input"
                        }, null, 8, a_), [
                          [Hn, u.feedback]
                        ]),
                        b("div", l_, ee(((ve = u.feedback) == null ? void 0 : ve.length) || 0) + "/500", 1)
                      ]),
                      b("button", {
                        onClick: (O) => Kc(u.session_id, Ft.value, u.feedback),
                        disabled: Ut.value || !Ft.value,
                        class: "submit-rating-button",
                        style: ke({ backgroundColor: E(s).accent_color || "var(--accent-solid)" })
                      }, ee(Ut.value ? "Submitting..." : "Submit Rating"), 13, c_)
                    ])) : se("", !0),
                    u.isSubmitted && u.finalFeedback ? (x(), A("div", u_, [
                      b("div", f_, [
                        b("p", h_, ee(u.finalFeedback), 1)
                      ])
                    ])) : u.isSubmitted ? (x(), A("div", d_, " Thank you for your rating! ")) : se("", !0)
                  ])) : u.message_type === "form" ? (x(), A("div", p_, [
                    (Ge = (he = u.attributes) == null ? void 0 : he.form_data) != null && Ge.title || (Yt = (we = u.attributes) == null ? void 0 : we.form_data) != null && Yt.description ? (x(), A("div", g_, [
                      (Jn = (_s = u.attributes) == null ? void 0 : _s.form_data) != null && Jn.title ? (x(), A("h3", m_, ee(u.attributes.form_data.title), 1)) : se("", !0),
                      (Xo = (Yo = u.attributes) == null ? void 0 : Yo.form_data) != null && Xo.description ? (x(), A("p", __, ee(u.attributes.form_data.description), 1)) : se("", !0)
                    ])) : se("", !0),
                    b("div", y_, [
                      (x(!0), A(Fe, null, gt((Jo = (Zo = u.attributes) == null ? void 0 : Zo.form_data) == null ? void 0 : Jo.fields, (O) => {
                        var Xt, dr;
                        return x(), A("div", {
                          key: O.name,
                          class: "form-field"
                        }, [
                          b("label", {
                            for: `form-${O.name}`,
                            class: "field-label"
                          }, [
                            dn(ee(O.label) + " ", 1),
                            O.required ? (x(), A("span", b_, "*")) : se("", !0)
                          ], 8, v_),
                          O.type === "text" || O.type === "email" || O.type === "tel" ? (x(), A("input", {
                            key: 0,
                            id: `form-${O.name}`,
                            type: O.type,
                            placeholder: O.placeholder || "",
                            required: O.required,
                            minlength: O.minLength,
                            maxlength: O.maxLength,
                            value: j.value[O.name] || "",
                            onInput: (Ue) => Ot(O.name, Ue.target.value),
                            onBlur: (Ue) => Ot(O.name, Ue.target.value),
                            class: ze(["form-input", { error: P.value[O.name] }]),
                            disabled: _.value,
                            autocomplete: O.type === "email" ? "email" : O.type === "tel" ? "tel" : "off",
                            inputmode: O.type === "tel" ? "tel" : O.type === "email" ? "email" : "text"
                          }, null, 42, w_)) : O.type === "number" ? (x(), A("input", {
                            key: 1,
                            id: `form-${O.name}`,
                            type: "number",
                            placeholder: O.placeholder || "",
                            required: O.required,
                            min: O.min,
                            max: O.max,
                            value: j.value[O.name] || "",
                            onInput: (Ue) => Ot(O.name, Ue.target.value),
                            class: ze(["form-input", { error: P.value[O.name] }]),
                            disabled: _.value
                          }, null, 42, k_)) : O.type === "textarea" ? (x(), A("textarea", {
                            key: 2,
                            id: `form-${O.name}`,
                            placeholder: O.placeholder || "",
                            required: O.required,
                            minlength: O.minLength,
                            maxlength: O.maxLength,
                            value: j.value[O.name] || "",
                            onInput: (Ue) => Ot(O.name, Ue.target.value),
                            class: ze(["form-textarea", { error: P.value[O.name] }]),
                            disabled: _.value,
                            rows: "3"
                          }, null, 42, x_)) : O.type === "select" ? (x(), A("select", {
                            key: 3,
                            id: `form-${O.name}`,
                            required: O.required,
                            value: j.value[O.name] || "",
                            onChange: (Ue) => Ot(O.name, Ue.target.value),
                            class: ze(["form-select", { error: P.value[O.name] }]),
                            disabled: _.value
                          }, [
                            b("option", T_, ee(O.placeholder || "Select an option"), 1),
                            (x(!0), A(Fe, null, gt((Array.isArray(O.options) ? O.options : ((Xt = O.options) == null ? void 0 : Xt.split(`
`)) || []).filter((Ue) => Ue.trim()), (Ue) => (x(), A("option", {
                              key: Ue.trim(),
                              value: Ue.trim()
                            }, ee(Ue.trim()), 9, S_))), 128))
                          ], 42, A_)) : O.type === "checkbox" ? (x(), A("div", E_, [
                            b("input", {
                              id: `form-${O.name}`,
                              type: "checkbox",
                              checked: j.value[O.name] || !1,
                              onChange: (Ue) => Ot(O.name, Ue.target.checked),
                              class: "form-checkbox",
                              disabled: _.value
                            }, null, 40, C_),
                            b("label", {
                              for: `form-${O.name}`,
                              class: "checkbox-label"
                            }, ee(O.placeholder || O.label), 9, R_)
                          ])) : O.type === "radio" ? (x(), A("div", I_, [
                            (x(!0), A(Fe, null, gt((Array.isArray(O.options) ? O.options : ((dr = O.options) == null ? void 0 : dr.split(`
`)) || []).filter((Ue) => Ue.trim()), (Ue) => (x(), A("div", {
                              key: Ue.trim(),
                              class: "radio-option"
                            }, [
                              b("input", {
                                id: `form-${O.name}-${Ue.trim()}`,
                                name: `form-${O.name}`,
                                type: "radio",
                                value: Ue.trim(),
                                checked: j.value[O.name] === Ue.trim(),
                                onChange: (Zy) => Ot(O.name, Ue.trim()),
                                class: "form-radio",
                                disabled: _.value
                              }, null, 40, L_),
                              b("label", {
                                for: `form-${O.name}-${Ue.trim()}`,
                                class: "radio-label"
                              }, ee(Ue.trim()), 9, O_)
                            ]))), 128))
                          ])) : se("", !0),
                          P.value[O.name] ? (x(), A("div", N_, ee(P.value[O.name]), 1)) : se("", !0)
                        ]);
                      }), 128))
                    ]),
                    b("div", P_, [
                      b("button", {
                        onClick: () => {
                          var O;
                          console.log("Regular form submit button clicked!"), Yc((O = u.attributes) == null ? void 0 : O.form_data);
                        },
                        disabled: _.value,
                        class: "form-submit-button",
                        style: ke(E(re))
                      }, ee(_.value ? "Submitting..." : ((ea = (Qo = u.attributes) == null ? void 0 : Qo.form_data) == null ? void 0 : ea.submit_button_text) || "Submit"), 13, M_)
                    ])
                  ])) : u.message_type === "user_input" ? (x(), A("div", F_, [
                    (ta = u.attributes) != null && ta.prompt_message && u.attributes.prompt_message.trim() ? (x(), A("div", D_, ee(u.attributes.prompt_message), 1)) : se("", !0),
                    u.isSubmitted ? (x(), A("div", z_, [
                      g[36] || (g[36] = b("strong", null, "Your input:", -1)),
                      dn(" " + ee(u.submittedValue) + " ", 1),
                      (na = u.attributes) != null && na.confirmation_message && u.attributes.confirmation_message.trim() ? (x(), A("div", H_, ee(u.attributes.confirmation_message), 1)) : se("", !0)
                    ])) : (x(), A("div", B_, [
                      En(b("textarea", {
                        "onUpdate:modelValue": (O) => u.userInputValue = O,
                        class: "user-input-textarea",
                        placeholder: "Type your message here...",
                        rows: "3",
                        onKeydown: [
                          wi(Wn((O) => ir(u), ["ctrl"]), ["enter"]),
                          wi(Wn((O) => ir(u), ["meta"]), ["enter"])
                        ]
                      }, null, 40, $_), [
                        [Hn, u.userInputValue]
                      ]),
                      b("button", {
                        class: "user-input-submit-button",
                        onClick: (O) => ir(u),
                        disabled: !u.userInputValue || !u.userInputValue.trim()
                      }, " Submit ", 8, U_)
                    ]))
                  ])) : u.shopify_output || u.message_type === "product" ? (x(), A("div", q_, [
                    u.message ? (x(), A("div", {
                      key: 0,
                      innerHTML: E(Ai)(((ia = (sa = u.shopify_output) == null ? void 0 : sa.products) == null ? void 0 : ia.length) > 0 ? Qc(u.message) : u.message),
                      class: "product-message-text"
                    }, null, 8, W_)) : se("", !0),
                    (ra = u.shopify_output) != null && ra.products && u.shopify_output.products.length > 0 ? (x(), A("div", j_, [
                      g[38] || (g[38] = b("h3", { class: "carousel-title" }, "Products", -1)),
                      b("div", V_, [
                        (x(!0), A(Fe, null, gt(u.shopify_output.products, (O) => {
                          var Xt;
                          return x(), A("div", {
                            key: O.id,
                            class: "product-card-compact carousel-item"
                          }, [
                            (Xt = O.image) != null && Xt.src ? (x(), A("div", K_, [
                              b("img", {
                                src: O.image.src,
                                alt: O.title,
                                class: "product-thumbnail"
                              }, null, 8, G_)
                            ])) : se("", !0),
                            b("div", Y_, [
                              b("div", X_, [
                                b("div", Z_, ee(O.title), 1),
                                O.variant_title && O.variant_title !== "Default Title" ? (x(), A("div", J_, ee(O.variant_title), 1)) : se("", !0),
                                b("div", Q_, ee(O.price_formatted || E(a)(O.price, O.currency)), 1)
                              ]),
                              b("div", ey, [
                                b("button", {
                                  class: "view-details-button-compact",
                                  onClick: (dr) => {
                                    var Ue;
                                    return Jc(O, (Ue = u.shopify_output) == null ? void 0 : Ue.shop_domain);
                                  }
                                }, g[37] || (g[37] = [
                                  dn(" View product ", -1),
                                  b("span", { class: "external-link-icon" }, "↗", -1)
                                ]), 8, ty)
                              ])
                            ])
                          ]);
                        }), 128))
                      ])
                    ])) : !u.message && ((oa = u.shopify_output) != null && oa.products) && u.shopify_output.products.length === 0 ? (x(), A("div", ny, g[39] || (g[39] = [
                      b("p", null, "No products found.", -1)
                    ]))) : !u.message && u.shopify_output && !u.shopify_output.products ? (x(), A("div", sy, g[40] || (g[40] = [
                      b("p", null, "No products to display.", -1)
                    ]))) : se("", !0)
                  ])) : (x(), A(Fe, { key: 4 }, [
                    E(ae)(Q) ? (x(), A("div", {
                      key: 0,
                      class: "message-streaming",
                      innerHTML: E(Ai)(E(de)(Q, u.message))
                    }, null, 8, iy)) : (x(), A("div", {
                      key: 1,
                      innerHTML: E(Ai)(u.message)
                    }, null, 8, ry)),
                    u.attachments && u.attachments.length > 0 ? (x(), A("div", oy, [
                      (x(!0), A(Fe, null, gt(u.attachments, (O) => (x(), A("div", {
                        key: O.id,
                        class: "attachment-item"
                      }, [
                        E($)(O.content_type) ? (x(), A("div", ay, [
                          b("img", {
                            src: E(Y)(O.file_url),
                            alt: O.filename,
                            class: "attachment-image",
                            onClick: Wn((Xt) => E(Ve)({ url: O.file_url, filename: O.filename, type: O.content_type, file_url: E(Y)(O.file_url), size: void 0 }), ["stop"]),
                            style: { cursor: "pointer" }
                          }, null, 8, ly),
                          b("div", cy, [
                            b("a", {
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
                                b("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                                b("polyline", { points: "7 10 12 15 17 10" }),
                                b("line", {
                                  x1: "12",
                                  y1: "15",
                                  x2: "12",
                                  y2: "3"
                                })
                              ], -1)),
                              dn(" " + ee(O.filename) + " ", 1),
                              b("span", fy, "(" + ee(E(S)(O.file_size)) + ")", 1)
                            ], 8, uy)
                          ])
                        ])) : (x(), A("a", {
                          key: 1,
                          href: E(Y)(O.file_url),
                          target: "_blank",
                          class: "attachment-link"
                        }, [
                          g[42] || (g[42] = b("svg", {
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
                          dn(" " + ee(O.filename) + " ", 1),
                          b("span", dy, "(" + ee(E(S)(O.file_size)) + ")", 1)
                        ], 8, hy))
                      ]))), 128))
                    ])) : se("", !0)
                  ], 64))
                ], 4),
                oi.value && (u.message_type === "bot" || u.message_type === "agent") && u.sources && u.sources.length ? (x(), A("div", py, [
                  g[43] || (g[43] = b("span", { class: "citation-label" }, "Sources", -1)),
                  (x(!0), A(Fe, null, gt(u.sources, (O, Xt) => (x(), A("span", {
                    key: Xt,
                    class: "citation-chip",
                    title: qo(O)
                  }, ee(lr(O)), 9, gy))), 128))
                ])) : se("", !0),
                b("div", my, [
                  u.message_type === "user" ? (x(), A("span", _y, " You ")) : se("", !0)
                ])
              ])
            ], 2);
          }), 128)),
          E(d) ? (x(), A("div", {
            key: 1,
            class: ze(["typing-indicator", { "reading-indicator": oi.value }])
          }, [
            oi.value ? (x(), A(Fe, { key: 0 }, [
              g[44] || (g[44] = b("div", {
                class: "reading-bars",
                "aria-hidden": "true"
              }, [
                b("span"),
                b("span"),
                b("span")
              ], -1)),
              g[45] || (g[45] = b("span", { class: "reading-label" }, "reading knowledge base", -1))
            ], 64)) : (x(), A("div", {
              key: 1,
              class: "cm-typing-bubble",
              style: ke(E(te))
            }, g[46] || (g[46] = [
              b("span", { class: "cm-typing-dot" }, null, -1),
              b("span", { class: "cm-typing-dot" }, null, -1),
              b("span", { class: "cm-typing-dot" }, null, -1)
            ]), 4))
          ], 2)) : se("", !0)
        ], 512), [
          [vh, !Bn.value]
        ]),
        uu.value ? (x(), A("div", yy, [
          (x(!0), A(Fe, null, gt(or.value, (u) => (x(), A("button", {
            key: u,
            type: "button",
            class: "cm-quick-action",
            disabled: !Mt.value,
            onClick: (Q) => Qs(u)
          }, ee(u), 9, vy))), 128))
        ])) : se("", !0),
        !xt.value && !Bn.value ? (x(), A("div", {
          key: 5,
          class: ze(["chat-input", { "ask-anything-input": zt.value }])
        }, [
          b("input", {
            ref_key: "fileInputRef",
            ref: ft,
            type: "file",
            accept: jy,
            multiple: "",
            style: { display: "none" },
            onChange: g[7] || (g[7] = //@ts-ignore
            (...u) => E(be) && E(be)(...u))
          }, null, 544),
          E(f).length > 0 ? (x(), A("div", by, [
            (x(!0), A(Fe, null, gt(E(f), (u, Q) => (x(), A("div", {
              key: Q,
              class: "file-preview-widget"
            }, [
              b("div", wy, [
                E(fs)(u.type) ? (x(), A("img", {
                  key: 0,
                  src: E(ne)(u),
                  alt: u.filename,
                  class: "file-preview-image-widget",
                  onClick: Wn((ve) => E(Ve)(u), ["stop"]),
                  style: { cursor: "pointer" }
                }, null, 8, ky)) : (x(), A("div", {
                  key: 1,
                  class: "file-preview-icon-widget",
                  onClick: Wn((ve) => E(Ve)(u), ["stop"]),
                  style: { cursor: "pointer" }
                }, g[47] || (g[47] = [
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
                ]), 8, xy))
              ]),
              b("div", Ay, [
                b("div", Ty, ee(u.filename), 1),
                b("div", Sy, ee(E(S)(u.size)), 1)
              ]),
              b("button", {
                type: "button",
                class: "file-preview-remove-widget",
                onClick: (ve) => E(wt)(Q),
                title: "Remove file"
              }, " × ", 8, Ey)
            ]))), 128))
          ])) : se("", !0),
          Mo.value ? (x(), A("div", Cy, g[48] || (g[48] = [
            b("div", { class: "upload-spinner-widget" }, null, -1),
            b("span", { class: "upload-text-widget" }, "Uploading files...", -1)
          ]))) : se("", !0),
          b("div", Ry, [
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
              class: ze({ disabled: !Mt.value, "ask-anything-field": zt.value })
            }, null, 42, Iy), [
              [Hn, Te.value]
            ]),
            eu.value ? (x(), A("button", {
              key: 0,
              type: "button",
              class: "attach-button",
              disabled: Mo.value,
              onClick: g[13] || (g[13] = //@ts-ignore
              (...u) => E(Js) && E(Js)(...u)),
              title: `Attach files (${E(f).length}/${al} used) or paste screenshots`
            }, g[49] || (g[49] = [
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
            ]), 8, Ly)) : se("", !0),
            b("button", {
              class: ze(["send-button", { "ask-anything-send": zt.value }]),
              style: ke(E(re)),
              onClick: en,
              disabled: !Te.value.trim() && E(f).length === 0 || !Mt.value
            }, g[50] || (g[50] = [
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
            ]), 14, Oy)
          ])
        ], 2)) : xt.value && !Bn.value ? (x(), A("div", Ny, [
          b("div", Py, [
            g[51] || (g[51] = b("p", { class: "ended-text" }, "This chat has ended.", -1)),
            b("button", {
              class: "start-new-conversation-button",
              style: ke(E(re)),
              onClick: ru
            }, " Click here to start a new conversation ", 4)
          ])
        ])) : se("", !0),
        Ho.value ? (x(), A("div", {
          key: 7,
          class: "ai-disclaimer",
          style: ke(E(me))
        }, ee(E(Xa)), 5)) : se("", !0),
        b("div", {
          class: "powered-by",
          style: ke(E(me))
        }, g[52] || (g[52] = [
          zn('<svg class="chattermate-logo" width="16" height="16" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-17e4cd7f><path d="M19 3H41A16 16 0 0 1 57 19V41A16 16 0 0 1 41 57H9A6 6 0 0 1 3 51V19A16 16 0 0 1 19 3Z" fill="#C9F24E" data-v-17e4cd7f></path><circle cx="19.7" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="30" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle><circle cx="40.3" cy="30" r="4.3" fill="#0B0C10" data-v-17e4cd7f></circle></svg><a class="cm-powered-link" href="https://chattermate.chat" target="_blank" rel="noopener" data-v-17e4cd7f><span class="cm-powered-prefix" data-v-17e4cd7f>Powered by </span><strong class="cm-brand" data-v-17e4cd7f>ChatterMate</strong></a>', 2)
        ]), 4)
      ], 6)) : se("", !0),
      ds.value ? (x(), A("div", My, [
        b("div", Fy, [
          g[53] || (g[53] = b("h3", null, "Rate your conversation", -1)),
          b("div", Dy, [
            (x(), A(Fe, null, gt(5, (u) => b("button", {
              key: u,
              onClick: (Q) => Dn.value = u,
              class: ze([{ active: u <= Dn.value }, "star-button"])
            }, " ★ ", 10, By)), 64))
          ]),
          En(b("textarea", {
            "onUpdate:modelValue": g[14] || (g[14] = (u) => Yn.value = u),
            placeholder: "Additional feedback (optional)",
            class: "rating-feedback"
          }, null, 512), [
            [Hn, Yn.value]
          ]),
          b("div", $y, [
            b("button", {
              onClick: g[15] || (g[15] = (u) => h.submitRating(Dn.value, Yn.value)),
              disabled: !Dn.value,
              class: "submit-button",
              style: ke(E(re))
            }, " Submit ", 12, Uy),
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
          E(C) && E(fs)(E(C).type) ? (x(), A("div", zy, [
            b("img", {
              src: E(ne)(E(C)),
              alt: E(C).filename,
              class: "preview-modal-image"
            }, null, 8, Hy),
            b("div", qy, ee(E(C).filename), 1)
          ])) : se("", !0)
        ])
      ])) : se("", !0)
    ], 6)) : (x(), A("div", Wy));
  }
}), Ky = /* @__PURE__ */ Rc(Vy, [["__scopeId", "data-v-17e4cd7f"]]);
window.process || (window.process = { env: { NODE_ENV: "production" } });
const qt = window.__INITIAL_DATA__, Wc = new URL(window.location.href), jc = Wc.searchParams.get("preview") === "true", Vc = (e) => {
  const t = Wc.searchParams.get(e);
  if (!(!t || t === "undefined" || t.trim() === ""))
    return t;
}, Gy = jc ? Vc("widget_id") || (qt == null ? void 0 : qt.widgetId) || void 0 : (qt == null ? void 0 : qt.widgetId) || void 0, Yy = jc ? (qt == null ? void 0 : qt.initialToken) || Vc("token") || void 0 : (qt == null ? void 0 : qt.initialToken) || void 0, Xy = $h(Ky, {
  widgetId: Gy,
  token: Yy || void 0,
  initialAuthError: null
  // Let backend determine if auth is required
});
Xy.mount("#app");

import { describe, expect, test } from 'bun:test';
import { createGround, GROUND } from '../client/gallery/flight/ground.js';

const list = [{ index: 0, x: 10, y: 0, child: { title: 'Poppy' } }, { index: 1, x: 20, y: 0, child: {} }];
const make = (extra = {}) => {
  const tour = { index: 3, moving: false };
  const walker = { x: 0, y: 0 };

  return { tour, walker, ground: createGround({ list, tour, walker, name: 'wild-flowers', ...extra }) };
};

describe('createGround', () => {
  test('welcomes by the gallery name and offers the first picture as the gate', () => {
    const { ground } = make();

    expect(ground.state()).toBeNull();
    ground.start();
    expect(ground.state()).toEqual({ phase: 'welcome', gate: 'Poppy', name: 'wild-flowers' });
    expect(ground.offered()).toBe(true);
  });

  test('a first picture without a title is the gate by its number', () => {
    const { ground } = make({ list: [{ index: 0, x: 1, y: 1, child: {} }, { index: 1, x: 2, y: 2, child: {} }] });

    ground.start();
    expect(ground.state().gate).toBe('1/2');
  });

  test('the guide going to the first picture is the taxi, to another one drops the offer', () => {
    const { ground } = make();

    ground.start();
    ground.guided(0);
    expect(ground.state().phase).toBe('taxi');
    expect(ground.offered()).toBe(false);
    ground.guided(1);
    expect(ground.state()).toBeNull();
  });

  test('the taxi arrives when the tour stands at the first picture', () => {
    const { ground, tour } = make();

    ground.start();
    ground.guided(0);
    Object.assign(tour, { index: 0, moving: true });
    ground.step(0.1, 'guide');
    expect(ground.state().phase).toBe('taxi');
    tour.moving = false;
    ground.step(0.1, 'guide');
    expect(ground.state().phase).toBe('arrived');
  });

  test('on foot the gate is reached within a few metres of the station, and the word goes after a while', () => {
    const { ground, walker } = make();

    ground.start();
    ground.step(0.1, 'free');
    expect(ground.state().phase).toBe('welcome');
    Object.assign(walker, { x: 10 - GROUND.gate / 2, y: 0 });
    ground.step(0.1, 'free');
    expect(ground.state().phase).toBe('arrived');
    ground.step(GROUND.stay + 1, 'free');
    expect(ground.state()).toBeNull();
  });
});
